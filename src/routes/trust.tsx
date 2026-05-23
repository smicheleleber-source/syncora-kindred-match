import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import {
  ACCOUNT_TYPE_LABEL,
  balanceOf,
  closeAccount,
  openAccount,
  postTxn,
  transfer,
  txnSign,
  useTrust,
  type AccountType,
  type TrustAccount,
  type TxnType,
} from "@/lib/trust-store";

export const Route = createFileRoute("/trust")({
  head: () => ({
    meta: [
      { title: "Trust & Escrow Banking — Syncora Connect" },
      {
        name: "description",
        content:
          "Hold and draw funds on behalf of clients, opposing counsel, third parties, and court registries. Strict no-overdraw ledger with deposit, draw, fee, and transfer postings.",
      },
      { property: "og:title", content: "Trust & Escrow Banking — Syncora Connect" },
      {
        property: "og:description",
        content:
          "IOLTA-style trust ledger: per-party balances, posted transactions, and statutory no-overdraw protection.",
      },
    ],
  }),
  component: TrustPage,
});

const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

const accountSchema = z.object({
  owner_name: z.string().trim().min(1, "Owner is required").max(120),
  account_type: z.enum(["client", "opposing_counsel", "third_party", "court_registry"]),
  matter_ref: z.string().trim().max(160).default(""),
  jurisdiction: z.string().trim().max(80).default(""),
  min_balance: z.number().min(0).max(10_000_000),
  notes: z.string().trim().max(500).default(""),
});

const txnSchema = z.object({
  account_id: z.string().min(1),
  date: z.string().min(8),
  type: z.enum(["deposit", "draw", "fee", "refund"]),
  amount: z.number().positive().max(1_000_000_000),
  memo: z.string().trim().max(240),
  reference: z.string().trim().max(80),
  counterparty: z.string().trim().max(120),
});

function TrustPage() {
  const { accounts, txns } = useTrust();
  const [selectedId, setSelectedId] = useState<string | null>(accounts[0]?.id ?? null);
  const [showNewAccount, setShowNewAccount] = useState(false);

  const totalsByType = useMemo(() => {
    const m = new Map<AccountType, number>();
    for (const a of accounts) {
      const cur = m.get(a.account_type) ?? 0;
      m.set(a.account_type, cur + balanceOf(a.id, txns));
    }
    return m;
  }, [accounts, txns]);
  const grandTotal = Array.from(totalsByType.values()).reduce((s, n) => s + n, 0);
  const selected = accounts.find((a) => a.id === selectedId) ?? null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link to="/portals" className="hover:text-primary">All portals</Link>
            <span>/</span>
            <span className="text-foreground">Trust & escrow banking</span>
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Trust &amp; escrow banking
          </h1>
          <p className="mt-3 max-w-3xl text-base text-muted-foreground">
            Hold funds on behalf of clients, opposing counsel, third parties, or the court
            registry, and post draws against them. Strict no-overdraw enforcement — every posting
            is rejected if it would push a balance below zero.
          </p>
          <p className="mt-2 max-w-3xl text-xs text-muted-foreground">
            Trust funds are <strong>not</strong> firm revenue. Commingling with operating funds is
            prohibited. This ledger is a working record; reconcile against your IOLTA bank
            statement monthly.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8 space-y-8">
        <section className="grid gap-3 md:grid-cols-5">
          <Stat label="Total on deposit" value={money(grandTotal)} highlight />
          {(["client", "opposing_counsel", "third_party", "court_registry"] as AccountType[]).map((t) => (
            <Stat key={t} label={ACCOUNT_TYPE_LABEL[t]} value={money(totalsByType.get(t) ?? 0)} />
          ))}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Accounts</h2>
            <button
              type="button"
              onClick={() => setShowNewAccount((v) => !v)}
              className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              {showNewAccount ? "Cancel" : "+ Open account"}
            </button>
          </div>
          {showNewAccount && <NewAccountForm onDone={() => setShowNewAccount(false)} />}
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {accounts.map((a) => {
              const bal = balanceOf(a.id, txns);
              const low = bal < a.min_balance;
              const active = selectedId === a.id;
              return (
                <button
                  type="button"
                  key={a.id}
                  onClick={() => setSelectedId(a.id)}
                  className={
                    "rounded-2xl border p-5 text-left transition " +
                    (active ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30")
                  }
                >
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full bg-muted px-2 py-0.5 capitalize">
                      {ACCOUNT_TYPE_LABEL[a.account_type]}
                    </span>
                    {a.jurisdiction && <span>{a.jurisdiction}</span>}
                    {a.closed_at && <span className="text-destructive">closed</span>}
                  </div>
                  <h3 className="mt-2 text-base font-semibold text-card-foreground">{a.owner_name}</h3>
                  <p className="text-xs text-muted-foreground">{a.matter_ref || "—"}</p>
                  <div className="mt-3 flex items-baseline gap-3">
                    <span className="text-2xl font-semibold text-foreground">{money(bal)}</span>
                    {low && !a.closed_at && (
                      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-700 dark:text-amber-300">
                        below min {money(a.min_balance)}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
            {accounts.length === 0 && (
              <p className="text-sm text-muted-foreground">No accounts yet — open one to start.</p>
            )}
          </div>
        </section>

        {selected && <AccountDetail account={selected} />}
      </main>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={
        "rounded-2xl border p-4 " +
        (highlight ? "border-primary/40 bg-primary/5" : "border-border bg-card")
      }
    >
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-semibold text-foreground">{value}</div>
    </div>
  );
}

function NewAccountForm({ onDone }: { onDone: () => void }) {
  const [owner, setOwner] = useState("");
  const [type, setType] = useState<AccountType>("client");
  const [matter, setMatter] = useState("");
  const [juris, setJuris] = useState("");
  const [min, setMin] = useState(0);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = accountSchema.safeParse({
      owner_name: owner, account_type: type, matter_ref: matter,
      jurisdiction: juris, min_balance: min, notes,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    openAccount(parsed.data);
    onDone();
  }
  return (
    <form onSubmit={submit} className="mt-3 grid gap-3 rounded-2xl border border-border bg-card p-5 md:grid-cols-2">
      <FieldText label="Owner / party" value={owner} onChange={setOwner} />
      <FieldSelect label="Account type" value={type} onChange={(v) => setType(v as AccountType)}
        options={(Object.keys(ACCOUNT_TYPE_LABEL) as AccountType[]).map((k) => ({ value: k, label: ACCOUNT_TYPE_LABEL[k] }))}
      />
      <FieldText label="Matter / caption" value={matter} onChange={setMatter} />
      <FieldText label="Jurisdiction / bank" value={juris} onChange={setJuris} placeholder="WA · IOLTA" />
      <FieldNumber label="Minimum balance ($)" value={min} onChange={setMin} />
      <FieldText label="Notes" value={notes} onChange={setNotes} wide />
      {error && <p className="md:col-span-2 text-sm text-destructive">{error}</p>}
      <div className="md:col-span-2 flex gap-2">
        <button type="submit" className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground">Open account</button>
        <button type="button" onClick={onDone} className="rounded-full border border-border px-4 py-1.5 text-sm">Cancel</button>
      </div>
    </form>
  );
}

function AccountDetail({ account }: { account: TrustAccount }) {
  const { accounts, txns } = useTrust();
  const balance = balanceOf(account.id, txns);
  const acctTxns = txns
    .filter((t) => t.account_id === account.id)
    .slice()
    .sort((a, b) => b.posted_at - a.posted_at);

  // running balance from oldest to newest
  const oldestFirst = acctTxns.slice().reverse();
  const runningMap = new Map<string, number>();
  let run = 0;
  for (const t of oldestFirst) {
    run += txnSign(t.type) * t.amount;
    runningMap.set(t.id, run);
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-card-foreground">{account.owner_name}</h2>
            <p className="text-xs text-muted-foreground">
              {ACCOUNT_TYPE_LABEL[account.account_type]} · {account.jurisdiction || "—"} · {account.matter_ref || "—"}
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Available balance</div>
            <div className="text-3xl font-semibold text-foreground">{money(balance)}</div>
          </div>
        </div>
        {account.notes && <p className="mt-3 text-sm text-muted-foreground">{account.notes}</p>}
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <button
            type="button"
            onClick={() => {
              if (!confirm(`Close account "${account.owner_name}"? Balance must be zero.`)) return;
              const ok = closeAccount(account.id);
              if (!ok) alert("Cannot close — balance is not zero.");
            }}
            disabled={!!account.closed_at}
            className="rounded-full border border-destructive/30 bg-destructive/5 px-3 py-1 text-destructive hover:bg-destructive/10 disabled:opacity-50"
          >
            Close account
          </button>
        </div>
      </div>

      <PostingForm account={account} />
      <TransferForm account={account} all={accounts} />

      <div>
        <h3 className="mb-3 text-base font-semibold text-foreground">Ledger</h3>
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Type</th>
                <th className="px-3 py-2 text-left">Counterparty</th>
                <th className="px-3 py-2 text-left">Memo / ref</th>
                <th className="px-3 py-2 text-right">Amount</th>
                <th className="px-3 py-2 text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {acctTxns.map((t) => {
                const sign = txnSign(t.type);
                return (
                  <tr key={t.id} className="border-b border-border/50 last:border-0">
                    <td className="px-3 py-2 text-muted-foreground">{t.date}</td>
                    <td className="px-3 py-2 capitalize">{t.type.replace("_", " ")}</td>
                    <td className="px-3 py-2">{t.counterparty || "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {t.memo}{t.reference && <span className="ml-2 font-mono text-xs">{t.reference}</span>}
                    </td>
                    <td className={"px-3 py-2 text-right font-medium " + (sign > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-foreground")}>
                      {sign > 0 ? "+" : "−"}{money(t.amount)}
                    </td>
                    <td className="px-3 py-2 text-right text-muted-foreground">{money(runningMap.get(t.id) ?? 0)}</td>
                  </tr>
                );
              })}
              {acctTxns.length === 0 && (
                <tr><td colSpan={6} className="px-3 py-6 text-center text-sm text-muted-foreground">No postings yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function PostingForm({ account }: { account: TrustAccount }) {
  const [type, setType] = useState<TxnType>("deposit");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState(0);
  const [memo, setMemo] = useState("");
  const [reference, setReference] = useState("");
  const [counterparty, setCounterparty] = useState("");
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const disabled = !!account.closed_at;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    const parsed = txnSchema.safeParse({
      account_id: account.id, date, type, amount, memo, reference, counterparty,
    });
    if (!parsed.success) {
      setFeedback({ ok: false, msg: parsed.error.issues[0]?.message ?? "Invalid input" });
      return;
    }
    const res = postTxn({ ...parsed.data, posted_by: "current user" });
    if (!res.ok) {
      setFeedback({ ok: false, msg: res.error });
      return;
    }
    setFeedback({ ok: true, msg: `Posted. New balance: ${money(res.balance)}` });
    setAmount(0); setMemo(""); setReference(""); setCounterparty("");
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-5">
      <h3 className="text-base font-semibold text-card-foreground">Post transaction</h3>
      <div className="mt-3 grid gap-3 md:grid-cols-6">
        <FieldSelect label="Type" value={type} onChange={(v) => setType(v as TxnType)}
          options={[
            { value: "deposit", label: "Deposit (+)" },
            { value: "draw", label: "Draw / withdrawal (−)" },
            { value: "fee", label: "Fee / disbursement (−)" },
            { value: "refund", label: "Refund (+)" },
          ]}
        />
        <FieldDate label="Date" value={date} onChange={setDate} />
        <FieldNumber label="Amount ($)" value={amount} onChange={setAmount} />
        <FieldText label="Counterparty" value={counterparty} onChange={setCounterparty} />
        <FieldText label="Reference (check / wire / order #)" value={reference} onChange={setReference} />
        <FieldText label="Memo" value={memo} onChange={setMemo} wide />
      </div>
      {feedback && (
        <p className={"mt-3 text-sm " + (feedback.ok ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")}>
          {feedback.msg}
        </p>
      )}
      <button type="submit" disabled={disabled}
        className="mt-3 rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
        {disabled ? "Account closed" : "Post"}
      </button>
    </form>
  );
}

function TransferForm({ account, all }: { account: TrustAccount; all: TrustAccount[] }) {
  const others = all.filter((a) => a.id !== account.id && !a.closed_at);
  const [toId, setToId] = useState(others[0]?.id ?? "");
  const [amount, setAmount] = useState(0);
  const [memo, setMemo] = useState("");
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  if (others.length === 0) return null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    if (amount <= 0) return setFeedback({ ok: false, msg: "Amount must be greater than zero" });
    if (memo.trim().length === 0) return setFeedback({ ok: false, msg: "Memo is required for transfers" });
    const res = transfer(account.id, toId, amount, memo.trim().slice(0, 240), "current user");
    if (!res.ok) return setFeedback({ ok: false, msg: res.error });
    setFeedback({ ok: true, msg: `Transferred ${money(amount)}.` });
    setAmount(0); setMemo("");
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-5">
      <h3 className="text-base font-semibold text-card-foreground">Transfer between accounts</h3>
      <div className="mt-3 grid gap-3 md:grid-cols-4">
        <FieldSelect label="To account" value={toId} onChange={setToId}
          options={others.map((a) => ({ value: a.id, label: `${a.owner_name} (${ACCOUNT_TYPE_LABEL[a.account_type]})` }))}
        />
        <FieldNumber label="Amount ($)" value={amount} onChange={setAmount} />
        <FieldText label="Memo (required)" value={memo} onChange={setMemo} wide />
      </div>
      {feedback && (
        <p className={"mt-3 text-sm " + (feedback.ok ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")}>
          {feedback.msg}
        </p>
      )}
      <button type="submit" className="mt-3 rounded-full border border-border bg-background px-4 py-1.5 text-sm font-medium text-foreground hover:border-primary/40">
        Transfer
      </button>
    </form>
  );
}

// ---- tiny field primitives ----
function FieldText({ label, value, onChange, wide, placeholder }: { label: string; value: string; onChange: (v: string) => void; wide?: boolean; placeholder?: string }) {
  return (
    <label className={(wide ? "md:col-span-2 " : "") + "block text-xs"}>
      <span className="font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm" />
    </label>
  );
}
function FieldNumber({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <label className="block text-xs">
      <span className="font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <input type="number" min={0} step="0.01" value={value} onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm" />
    </label>
  );
}
function FieldDate({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block text-xs">
      <span className="font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <input type="date" value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm" />
    </label>
  );
}
function FieldSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label className="block text-xs">
      <span className="font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}
