import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  addCase,
  addDoc,
  addTime,
  removeCase,
  removeDoc,
  removeTime,
  updateCase,
  useSolicitor,
  type SolicitorCase,
  type SolicitorCaseStatus,
  type SolicitorDoc,
} from "@/lib/solicitor-store";

export const Route = createFileRoute("/solicitor")({
  head: () => ({
    meta: [
      { title: "Solicitor Workspace — Syncora Connect" },
      {
        name: "description",
        content:
          "A workspace for government solicitors (Solicitor General, City/State/County Solicitor): matter management, time logs for public reporting, document collaboration, and caseload analytics. Solicitors are public legal officers — no client billing or fee collection.",
      },
      { property: "og:title", content: "Solicitor Workspace — Syncora Connect" },
      {
        property: "og:description",
        content:
          "Manage government matters, log time for public reporting, share filings, and review caseload analytics. Built for public-sector solicitors, not private fee-for-service practice.",
      },
    ],
  }),
  component: SolicitorPage,
});

type Tab = "cases" | "time" | "docs" | "analytics";

const STATUSES: SolicitorCaseStatus[] = ["intake", "active", "in_court", "settled", "closed"];

function SolicitorPage() {
  const [tab, setTab] = useState<Tab>("cases");
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-primary">Syncora Connect</Link>
            <span>/</span>
            <span className="text-foreground">Solicitor workspace</span>
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Solicitor workspace
          </h1>
          <p className="mt-3 max-w-3xl text-base text-muted-foreground">
            For government solicitors — Solicitor General, City, County, and State Solicitors — who
            represent a public entity in court. Track matters, log time for public reporting, share
            filings with co-counsel and agency partners, and review caseload analytics.
          </p>
          <p className="mt-2 max-w-3xl text-xs text-muted-foreground">
            Solicitors are public legal officers — no client billing or fee-for-service invoicing.
            Statutory <strong>motion fees</strong> and filing fees accepted at the counter are
            receipted here for the public record.
          </p>
          <nav className="mt-6 inline-flex rounded-full border border-border bg-background p-1">
            {(["cases", "time", "docs", "analytics"] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={
                  "rounded-full px-4 py-1.5 text-sm font-medium capitalize transition " +
                  (tab === t
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground")
                }
              >
                {t === "docs" ? "Filings" : t === "time" ? "Time log" : t === "cases" ? "Matters" : t}
              </button>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">
        {tab === "cases" && <CasesPanel />}
        {tab === "time" && <TimeLogPanel />}
        {tab === "docs" && <DocsPanel />}
        {tab === "analytics" && <AnalyticsPanel />}
      </main>
    </div>
  );
}

function statusTone(s: SolicitorCaseStatus) {
  const map: Record<SolicitorCaseStatus, string> = {
    intake: "bg-muted text-muted-foreground",
    active: "bg-primary/10 text-primary",
    in_court: "bg-accent/15 text-accent-foreground ring-1 ring-accent/40",
    settled: "bg-primary/10 text-primary",
    closed: "bg-muted text-muted-foreground",
  };
  return map[s];
}

function CasesPanel() {
  const { cases } = useSolicitor();
  const [editing, setEditing] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Active matters</h2>
        <button
          type="button"
          onClick={() => setShowNew((v) => !v)}
          className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          {showNew ? "Cancel" : "+ New case"}
        </button>
      </div>

      {showNew && <CaseForm onDone={() => setShowNew(false)} />}

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {cases.map((c) => (
          <article
            key={c.id}
            className="rounded-2xl border border-border bg-card p-5 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <span
                className={
                  "rounded-full px-2 py-0.5 text-xs font-medium capitalize " +
                  statusTone(c.status)
                }
              >
                {c.status.replace("_", " ")}
              </span>
              <span className="text-xs text-muted-foreground">{c.category}</span>
            </div>
            <h3 className="mt-3 text-base font-semibold text-card-foreground">
              {c.client_name}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{c.matter}</p>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
              <div>
                <dt className="font-medium text-foreground">Next event</dt>
                <dd>{c.next_event}</dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">Date</dt>
                <dd>{c.next_date}</dd>
              </div>
            </dl>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={() => setEditing(editing === c.id ? null : c.id)}
                className="rounded-full border border-border bg-background px-3 py-1 text-muted-foreground hover:text-foreground"
              >
                {editing === c.id ? "Close" : "Edit"}
              </button>
              <select
                value={c.status}
                onChange={(e) => updateCase(c.id, { status: e.target.value as SolicitorCaseStatus })}
                className="rounded-full border border-border bg-background px-3 py-1 text-muted-foreground"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s.replace("_", " ")}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => removeCase(c.id)}
                className="ml-auto rounded-full border border-destructive/30 bg-destructive/5 px-3 py-1 text-destructive hover:bg-destructive/10"
              >
                Delete
              </button>
            </div>
            {editing === c.id && <CaseForm initial={c} onDone={() => setEditing(null)} />}
          </article>
        ))}
        {cases.length === 0 && (
          <p className="text-sm text-muted-foreground">No cases yet — add your first matter.</p>
        )}
      </div>
    </section>
  );
}

function CaseForm({ initial, onDone }: { initial?: SolicitorCase; onDone: () => void }) {
  const [client, setClient] = useState(initial?.client_name ?? "");
  const [matter, setMatter] = useState(initial?.matter ?? "");
  const [category, setCategory] = useState(initial?.category ?? "Medical malpractice");
  const [status, setStatus] = useState<SolicitorCaseStatus>(initial?.status ?? "intake");
  const [nextEvent, setNextEvent] = useState(initial?.next_event ?? "Initial consultation");
  const [nextDate, setNextDate] = useState(initial?.next_date ?? new Date().toISOString().slice(0, 10));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!client.trim() || !matter.trim()) return;
    const payload = {
      client_name: client.trim(),
      matter: matter.trim(),
      category,
      status,
      next_event: nextEvent,
      next_date: nextDate,
      hourly_rate: 0,
    };
    if (initial) updateCase(initial.id, payload);
    else addCase(payload);
    onDone();
  }

  return (
    <form
      onSubmit={submit}
      className="mt-4 grid gap-3 rounded-xl border border-border bg-background p-4 md:grid-cols-2"
    >
      <Field label="Party / agency">
        <input value={client} onChange={(e) => setClient(e.target.value)} className="input" />
      </Field>
      <Field label="Category">
        <input value={category} onChange={(e) => setCategory(e.target.value)} className="input" />
      </Field>
      <Field label="Matter" wide>
        <input value={matter} onChange={(e) => setMatter(e.target.value)} className="input" />
      </Field>
      <Field label="Next event">
        <input value={nextEvent} onChange={(e) => setNextEvent(e.target.value)} className="input" />
      </Field>
      <Field label="Date">
        <input type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)} className="input" />
      </Field>
      <Field label="Status">
        <select value={status} onChange={(e) => setStatus(e.target.value as SolicitorCaseStatus)} className="input">
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace("_", " ")}</option>
          ))}
        </select>
      </Field>
      <div className="md:col-span-2 flex gap-2">
        <button type="submit" className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground">
          {initial ? "Save" : "Add case"}
        </button>
        <button type="button" onClick={onDone} className="rounded-full border border-border px-4 py-1.5 text-sm">
          Cancel
        </button>
      </div>
      <style>{`.input{width:100%;border:1px solid hsl(var(--border));background:hsl(var(--background));border-radius:6px;padding:6px 10px;font-size:14px}`}</style>
    </form>
  );
}

function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <label className={(wide ? "md:col-span-2 " : "") + "block text-xs"}>
      <span className="font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function TimeLogPanel() {
  const { cases, time } = useSolicitor();
  const [caseId, setCaseId] = useState(cases[0]?.id ?? "");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [hours, setHours] = useState(1);
  const [desc, setDesc] = useState("");

  function logTime(e: React.FormEvent) {
    e.preventDefault();
    if (!caseId || !desc.trim() || hours <= 0) return;
    addTime({ case_id: caseId, date, hours, description: desc.trim(), billed: true });
    setDesc("");
    setHours(1);
  }

  const hoursByCase = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of time) map.set(t.case_id, (map.get(t.case_id) ?? 0) + t.hours);
    return map;
  }, [time]);

  return (
    <section className="space-y-8">
      <div className="grid gap-3 md:grid-cols-3">
        <Stat label="Hours this period" value={time.reduce((s, t) => s + t.hours, 0).toFixed(2)} />
        <Stat label="Matters logged" value={hoursByCase.size.toString()} />
        <Stat label="Entries" value={time.length.toString()} />
      </div>
      <p className="text-xs text-muted-foreground">
        Time is logged for public-reporting and caseload-management purposes — solicitors do not bill
        parties or collect fees.
      </p>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-base font-semibold text-card-foreground">Log time</h2>
        <form onSubmit={logTime} className="mt-3 grid gap-3 md:grid-cols-5">
          <select value={caseId} onChange={(e) => setCaseId(e.target.value)} className="input md:col-span-2">
            {cases.map((c) => (
              <option key={c.id} value={c.id}>{c.client_name} — {c.matter.slice(0, 30)}</option>
            ))}
          </select>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
          <input type="number" step="0.25" min={0} value={hours} onChange={(e) => setHours(Number(e.target.value) || 0)} className="input" placeholder="Hours" />
          <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description" className="input md:col-span-5" />
          <button type="submit" className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground md:col-span-1">
            Log entry
          </button>
        </form>
        <style>{`.input{border:1px solid hsl(var(--border));background:hsl(var(--background));border-radius:6px;padding:6px 10px;font-size:14px}`}</style>
      </div>

      <div>
        <h2 className="mb-3 text-base font-semibold text-foreground">Recent time entries</h2>
        <ul className="divide-y divide-border rounded-xl border border-border bg-card">
          {time.slice().reverse().map((t) => {
            const c = cases.find((x) => x.id === t.case_id);
            return (
              <li key={t.id} className="flex items-center gap-3 p-3 text-sm">
                <span className="w-20 text-xs text-muted-foreground">{t.date}</span>
                <span className="w-32 truncate text-foreground">{c?.client_name ?? "—"}</span>
                <span className="flex-1 text-muted-foreground">{t.description}</span>
                <span className="w-16 text-right">{t.hours.toFixed(2)}h</span>
                <button type="button" onClick={() => removeTime(t.id)} className="text-xs text-destructive hover:underline">
                  delete
                </button>
              </li>
            );
          })}
          {time.length === 0 && <li className="p-4 text-sm text-muted-foreground">No entries yet.</li>}
        </ul>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-card-foreground">{value}</div>
    </div>
  );
}

function DocsPanel() {
  const { cases, docs } = useSolicitor();
  const [caseId, setCaseId] = useState(cases[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<SolicitorDoc["kind"]>("pleading");
  const [shared, setShared] = useState("client");
  const [notes, setNotes] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !caseId) return;
    addDoc({
      case_id: caseId,
      title: title.trim(),
      kind,
      shared_with: shared.split(",").map((s) => s.trim()).filter(Boolean),
      notes: notes.trim(),
    });
    setTitle("");
    setNotes("");
  }

  return (
    <section className="space-y-6">
      <form onSubmit={submit} className="grid gap-3 rounded-2xl border border-border bg-card p-5 md:grid-cols-2">
        <Field label="Case">
          <select value={caseId} onChange={(e) => setCaseId(e.target.value)} className="input">
            {cases.map((c) => (
              <option key={c.id} value={c.id}>{c.client_name}</option>
            ))}
          </select>
        </Field>
        <Field label="Title">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="input" />
        </Field>
        <Field label="Kind">
          <select value={kind} onChange={(e) => setKind(e.target.value as SolicitorDoc["kind"])} className="input">
            {["pleading", "contract", "evidence", "correspondence", "memo"].map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </Field>
        <Field label="Shared with (comma-separated)">
          <input value={shared} onChange={(e) => setShared(e.target.value)} className="input" placeholder="client, co-counsel" />
        </Field>
        <Field label="Notes" wide>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="input" />
        </Field>
        <button type="submit" className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground">
          Add document
        </button>
        <style>{`.input{width:100%;border:1px solid hsl(var(--border));background:hsl(var(--background));border-radius:6px;padding:6px 10px;font-size:14px}`}</style>
      </form>

      <ul className="grid gap-3 md:grid-cols-2">
        {docs.slice().reverse().map((d) => {
          const c = cases.find((x) => x.id === d.case_id);
          return (
            <li key={d.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-full bg-muted px-2 py-0.5 capitalize">{d.kind}</span>
                <span>{c?.client_name ?? "—"}</span>
                <span className="ml-auto">{new Date(d.updated_at).toLocaleDateString()}</span>
              </div>
              <h3 className="mt-2 text-base font-semibold text-card-foreground">{d.title}</h3>
              {d.notes && <p className="mt-1 text-sm text-muted-foreground">{d.notes}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {d.shared_with.map((s) => (
                  <span key={s} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    {s}
                  </span>
                ))}
                <button
                  type="button"
                  onClick={() => removeDoc(d.id)}
                  className="ml-auto text-xs text-destructive hover:underline"
                >
                  delete
                </button>
              </div>
            </li>
          );
        })}
        {docs.length === 0 && <li className="text-sm text-muted-foreground">No documents yet.</li>}
      </ul>
    </section>
  );
}

function AnalyticsPanel() {
  const { cases, time } = useSolicitor();

  const byStatus = useMemo(() => {
    const map = new Map<SolicitorCaseStatus, number>();
    for (const c of cases) map.set(c.status, (map.get(c.status) ?? 0) + 1);
    return map;
  }, [cases]);

  const totalHours = time.reduce((s, t) => s + t.hours, 0);
  const inCourt = cases.filter((c) => c.status === "in_court").length;
  const closed = cases.filter((c) => c.status === "closed").length;

  const upcoming = cases
    .slice()
    .sort((a, b) => a.next_date.localeCompare(b.next_date))
    .slice(0, 5);

  return (
    <section className="space-y-8">
      <div className="grid gap-3 md:grid-cols-4">
        <Stat label="Open matters" value={cases.filter((c) => c.status !== "closed").length.toString()} />
        <Stat label="Total hours" value={totalHours.toFixed(1)} />
        <Stat label="In court" value={inCourt.toString()} />
        <Stat label="Closed" value={closed.toString()} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-card-foreground">Caseload by status</h3>
          <ul className="mt-3 space-y-2">
            {STATUSES.map((s) => {
              const n = byStatus.get(s) ?? 0;
              const pct = cases.length ? Math.round((n / cases.length) * 100) : 0;
              return (
                <li key={s} className="text-xs">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="capitalize">{s.replace("_", " ")}</span>
                    <span>{n} · {pct}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 text-xs text-muted-foreground">
            Public office caseload — no billing, no revenue tracked.
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-card-foreground">Upcoming court & agency events</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {upcoming.map((c) => (
              <li key={c.id} className="flex items-center gap-2">
                <span className="w-24 text-xs text-muted-foreground">{c.next_date}</span>
                <span className="font-medium text-foreground">{c.client_name}</span>
                <span className="text-muted-foreground">— {c.next_event}</span>
              </li>
            ))}
            {upcoming.length === 0 && <li className="text-sm text-muted-foreground">No scheduled events.</li>}
          </ul>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Match-quality and client feedback analytics flow in from <Link to="/reviews" className="text-primary hover:underline">client reviews</Link>.
      </p>
    </section>
  );
}