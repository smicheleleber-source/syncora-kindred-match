import { useSyncExternalStore } from "react";

const KEY = "syncora.trust.v1";

export type AccountType = "client" | "opposing_counsel" | "third_party" | "court_registry";
export type TxnType = "deposit" | "draw" | "fee" | "transfer_in" | "transfer_out" | "refund";

export type TrustAccount = {
  id: string;
  owner_name: string;
  account_type: AccountType;
  matter_ref: string;       // case / matter caption
  jurisdiction: string;     // for IOLTA / registry rules
  min_balance: number;      // warn if balance dips below
  opened_at: number;
  closed_at: number | null;
  notes: string;
};

export type TrustTxn = {
  id: string;
  account_id: string;
  date: string;             // ISO date
  type: TxnType;
  amount: number;           // always positive; sign derived from type
  memo: string;
  reference: string;        // check #, wire ref, court order #
  counterparty: string;     // payer / payee
  posted_at: number;
  posted_by: string;        // display name / email
};

export type TrustState = {
  accounts: TrustAccount[];
  txns: TrustTxn[];
};

const SEED: TrustState = {
  accounts: [
    {
      id: "a1",
      owner_name: "Avery Lin",
      account_type: "client",
      matter_ref: "Lin v. Northgate Medical",
      jurisdiction: "WA · IOLTA",
      min_balance: 500,
      opened_at: Date.now() - 30 * 86400000,
      closed_at: null,
      notes: "Retainer for malpractice litigation.",
    },
    {
      id: "a2",
      owner_name: "Northgate Coop (opposing counsel escrow)",
      account_type: "opposing_counsel",
      matter_ref: "Lin v. Northgate Medical",
      jurisdiction: "WA · Court escrow",
      min_balance: 0,
      opened_at: Date.now() - 10 * 86400000,
      closed_at: null,
      notes: "Disputed funds pending settlement.",
    },
  ],
  txns: [
    { id: "t1", account_id: "a1", date: iso(-28), type: "deposit", amount: 10000, memo: "Initial retainer", reference: "WIRE-88421", counterparty: "Avery Lin", posted_at: Date.now() - 28 * 86400000, posted_by: "system" },
    { id: "t2", account_id: "a1", date: iso(-14), type: "draw",    amount: 1750,  memo: "Expert witness deposit",         reference: "CHK-1041",   counterparty: "Dr. R. Patel",  posted_at: Date.now() - 14 * 86400000, posted_by: "system" },
    { id: "t3", account_id: "a1", date: iso(-3),  type: "fee",     amount: 350,   memo: "Court filing fees",              reference: "RCT-9921",   counterparty: "King County Sup. Ct.", posted_at: Date.now() - 3 * 86400000, posted_by: "system" },
    { id: "t4", account_id: "a2", date: iso(-9),  type: "deposit", amount: 25000, memo: "Disputed settlement holding",    reference: "WIRE-77310", counterparty: "Northgate Coop", posted_at: Date.now() - 9 * 86400000, posted_by: "system" },
  ],
};

function iso(daysOffset: number) {
  return new Date(Date.now() + daysOffset * 86400000).toISOString().slice(0, 10);
}

function load(): TrustState {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as TrustState) : SEED;
  } catch {
    return SEED;
  }
}

let state: TrustState = load();
const listeners = new Set<() => void>();
function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* noop */ }
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); }

export function useTrust() {
  return useSyncExternalStore(subscribe, () => state, () => state);
}

const uid = () => Math.random().toString(36).slice(2, 10);

export function txnSign(t: TxnType): 1 | -1 {
  return t === "deposit" || t === "transfer_in" || t === "refund" ? 1 : -1;
}

export function balanceOf(accountId: string, txns: TrustTxn[] = state.txns): number {
  return txns
    .filter((t) => t.account_id === accountId)
    .reduce((s, t) => s + txnSign(t.type) * t.amount, 0);
}

export type PostResult =
  | { ok: true; txn: TrustTxn; balance: number }
  | { ok: false; error: string };

export function postTxn(
  input: Omit<TrustTxn, "id" | "posted_at">,
): PostResult {
  const acct = state.accounts.find((a) => a.id === input.account_id);
  if (!acct) return { ok: false, error: "Account not found" };
  if (acct.closed_at) return { ok: false, error: "Account is closed" };
  if (input.amount <= 0) return { ok: false, error: "Amount must be greater than zero" };
  if (input.amount > 1_000_000_000) return { ok: false, error: "Amount exceeds posting limit" };

  const current = balanceOf(input.account_id);
  const projected = current + txnSign(input.type) * input.amount;
  if (projected < 0) {
    return { ok: false, error: `Insufficient funds — balance would be $${projected.toLocaleString()}. No overdraw allowed on a trust account.` };
  }

  const txn: TrustTxn = { ...input, id: uid(), posted_at: Date.now() };
  state = { ...state, txns: [...state.txns, txn] };
  persist();
  return { ok: true, txn, balance: projected };
}

export function openAccount(input: Omit<TrustAccount, "id" | "opened_at" | "closed_at">): TrustAccount {
  const acct: TrustAccount = { ...input, id: uid(), opened_at: Date.now(), closed_at: null };
  state = { ...state, accounts: [...state.accounts, acct] };
  persist();
  return acct;
}

export function closeAccount(id: string): boolean {
  const bal = balanceOf(id);
  if (bal !== 0) return false;
  state = {
    ...state,
    accounts: state.accounts.map((a) => (a.id === id ? { ...a, closed_at: Date.now() } : a)),
  };
  persist();
  return true;
}

export function transfer(
  fromId: string,
  toId: string,
  amount: number,
  memo: string,
  postedBy: string,
): PostResult {
  if (fromId === toId) return { ok: false, error: "Cannot transfer to the same account" };
  const out = postTxn({
    account_id: fromId,
    date: new Date().toISOString().slice(0, 10),
    type: "transfer_out",
    amount,
    memo: `Transfer to ${toId} — ${memo}`,
    reference: "",
    counterparty: toId,
    posted_by: postedBy,
  });
  if (!out.ok) return out;
  const inn = postTxn({
    account_id: toId,
    date: new Date().toISOString().slice(0, 10),
    type: "transfer_in",
    amount,
    memo: `Transfer from ${fromId} — ${memo}`,
    reference: "",
    counterparty: fromId,
    posted_by: postedBy,
  });
  return inn;
}

export const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = {
  client: "Client retainer",
  opposing_counsel: "Opposing counsel escrow",
  third_party: "Third-party trust",
  court_registry: "Court registry",
};
