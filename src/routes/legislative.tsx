import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ALL_BILL_STATUSES,
  ALL_FEATURE_AREAS,
  ALL_THREAT_LEVELS,
  TASK_KIND_LABELS,
  addBill,
  addLobbyist,
  addTask,
  deleteBill,
  deleteLobbyist,
  deleteTask,
  featureLabel,
  generateTasksForBill,
  healthLabel,
  healthScore,
  updateBill,
  updateTask,
  useBills,
  useLobbyists,
  useTasks,
  type Bill,
  type BillStatus,
  type FeatureArea,
  type OppositionTask,
  type TaskStatus,
  type ThreatLevel,
} from "@/lib/legislative-monitor";

export const Route = createFileRoute("/legislative")({
  head: () => ({
    meta: [
      { title: "Legislative Health Monitor — Syncora Connect" },
      {
        name: "description",
        content:
          "Track bills that would limit Syncoraconnect's features, the lobbyists pushing them, and the opposition tasks needed to defend transparency.",
      },
    ],
  }),
  component: LegislativePage,
});

function LegislativePage() {
  const bills = useBills();
  const lobbyists = useLobbyists();
  const tasks = useTasks();

  const score = useMemo(() => healthScore(bills), [bills]);
  const health = healthLabel(score);

  const activeBills = bills.filter((b) => b.status !== "dead");
  const taskByBill = useMemo(() => {
    const m = new Map<string, OppositionTask[]>();
    for (const t of tasks) {
      const arr = m.get(t.billId) ?? [];
      arr.push(t);
      m.set(t.billId, arr);
    }
    return m;
  }, [tasks]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <Link to="/" className="text-lg font-semibold tracking-tight">
            Syncora <span className="text-primary">Connect</span>
          </Link>
          <nav className="flex flex-wrap gap-2 text-xs">
            <Link to="/" className="rounded-full border border-border px-3 py-1 hover:border-primary/40">
              ← Home
            </Link>
            <Link to="/playbooks/matrix" className="rounded-full border border-border px-3 py-1 hover:border-primary/40">
              Litigation matrix
            </Link>
            <Link to="/collab" className="rounded-full border border-border px-3 py-1 hover:border-primary/40">
              Doc collab
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-10 px-6 py-10">
        <section>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Legislative Health Monitor</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Because Syncoraconnect's transparency model can attract legislation
                designed to circumvent public visibility, this dashboard tracks bills
                that would limit our features, maps them to the lobbyists pushing them,
                and turns each threat into a reviewable opposition task list.
              </p>
            </div>
            <HealthBadge label={health.label} tone={health.tone} score={score} />
          </div>
        </section>

        <Stats activeBills={activeBills.length} lobbyists={lobbyists.length} tasks={tasks} />

        <BillsSection bills={bills} lobbyists={lobbyists} taskByBill={taskByBill} />

        <NewBillForm />

        <TasksSection tasks={tasks} bills={bills} />

        <LobbyistsSection lobbyists={lobbyists} />
      </main>
    </div>
  );
}

function HealthBadge({
  label,
  tone,
  score,
}: {
  label: string;
  tone: "ok" | "warn" | "danger" | "critical";
  score: number;
}) {
  const toneClass = {
    ok: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
    warn: "bg-amber-500/10 text-amber-600 border-amber-500/30",
    danger: "bg-orange-500/10 text-orange-600 border-orange-500/30",
    critical: "bg-red-500/10 text-red-600 border-red-500/30",
  }[tone];
  return (
    <div className={`rounded-2xl border px-5 py-3 text-right ${toneClass}`}>
      <div className="text-[10px] uppercase tracking-wider opacity-80">Platform health</div>
      <div className="text-2xl font-semibold">{label}</div>
      <div className="text-[11px] opacity-80">risk score {score.toFixed(1)}</div>
    </div>
  );
}

function Stats({
  activeBills,
  lobbyists,
  tasks,
}: {
  activeBills: number;
  lobbyists: number;
  tasks: OppositionTask[];
}) {
  const open = tasks.filter((t) => t.status !== "done").length;
  return (
    <section className="grid gap-3 sm:grid-cols-4">
      <Stat label="Active bills" value={activeBills} />
      <Stat label="Lobbyists tracked" value={lobbyists} />
      <Stat label="Open tasks" value={open} />
      <Stat label="Tasks total" value={tasks.length} />
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function BillsSection({
  bills,
  lobbyists,
  taskByBill,
}: {
  bills: Bill[];
  lobbyists: ReturnType<typeof useLobbyists>;
  taskByBill: Map<string, OppositionTask[]>;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Bills under monitor</h2>
      <div className="space-y-3">
        {bills.length === 0 ? (
          <p className="text-sm text-muted-foreground">No bills tracked yet.</p>
        ) : (
          bills.map((b) => (
            <BillCard
              key={b.id}
              bill={b}
              lobbyists={lobbyists}
              tasks={taskByBill.get(b.id) ?? []}
            />
          ))
        )}
      </div>
    </section>
  );
}

function BillCard({
  bill,
  lobbyists,
  tasks,
}: {
  bill: Bill;
  lobbyists: ReturnType<typeof useLobbyists>;
  tasks: OppositionTask[];
}) {
  const linked = lobbyists.filter((l) => bill.linkedLobbyistIds.includes(l.id));
  const threatTone = {
    low: "bg-muted text-foreground",
    moderate: "bg-amber-500/10 text-amber-700 border border-amber-500/30",
    high: "bg-orange-500/10 text-orange-700 border border-orange-500/30",
    critical: "bg-red-500/10 text-red-700 border border-red-500/30",
  }[bill.threat];

  return (
    <article className="rounded-2xl border border-border bg-card p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">{bill.number}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${threatTone}`}>
              {bill.threat} threat
            </span>
            <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              {bill.status.replace("_", " ")}
            </span>
            <span className="text-[11px] text-muted-foreground">{bill.jurisdiction}</span>
          </div>
          <h3 className="mt-1 text-lg font-semibold">{bill.title}</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            className="rounded-md border border-border bg-background px-2 py-1 text-xs"
            value={bill.status}
            onChange={(e) => updateBill(bill.id, { status: e.target.value as BillStatus })}
          >
            {ALL_BILL_STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace("_", " ")}</option>
            ))}
          </select>
          <select
            className="rounded-md border border-border bg-background px-2 py-1 text-xs"
            value={bill.threat}
            onChange={(e) => updateBill(bill.id, { threat: e.target.value as ThreatLevel })}
          >
            {ALL_THREAT_LEVELS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => deleteBill(bill.id)}
            className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:text-red-600"
          >
            Remove
          </button>
        </div>
      </header>

      <p className="mt-3 text-sm text-foreground/90">{bill.summary}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {bill.affects.map((a) => (
          <span key={a} className="rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-[11px] text-primary">
            limits: {featureLabel(a)}
          </span>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Sponsors</div>
          <div className="text-sm">{bill.sponsors.join(", ") || "—"}</div>
          {bill.sourceUrl && (
            <a
              href={bill.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block text-xs text-primary underline"
            >
              Bill text →
            </a>
          )}
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Linked lobbyists</div>
          {linked.length === 0 ? (
            <div className="text-xs text-muted-foreground">None linked yet.</div>
          ) : (
            <ul className="text-sm">
              {linked.map((l) => (
                <li key={l.id}>
                  <span className="font-medium">{l.name}</span>{" "}
                  <span className="text-xs text-muted-foreground">— {l.firm}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-dashed border-border p-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">Opposition tasks ({tasks.length})</div>
          <button
            type="button"
            onClick={() => generateTasksForBill(bill.id)}
            className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:opacity-90"
          >
            Generate task list
          </button>
        </div>
        {tasks.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            No tasks yet — click <em>Generate task list</em> to draft opposition work
            (contract, testimony, coalition outreach) an employee can review.
          </p>
        ) : (
          <ul className="mt-2 space-y-1.5 text-sm">
            {tasks.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center gap-2">
                <select
                  value={t.status}
                  onChange={(e) => updateTask(t.id, { status: e.target.value as TaskStatus })}
                  className="rounded border border-border bg-background px-1.5 py-0.5 text-[11px]"
                >
                  <option value="todo">todo</option>
                  <option value="in_progress">in progress</option>
                  <option value="blocked">blocked</option>
                  <option value="done">done</option>
                </select>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {TASK_KIND_LABELS[t.kind]}
                </span>
                <span className={t.status === "done" ? "line-through text-muted-foreground" : ""}>
                  {t.title}
                </span>
                <button
                  type="button"
                  onClick={() => deleteTask(t.id)}
                  className="ml-auto text-[11px] text-muted-foreground hover:text-red-600"
                >
                  delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

function NewBillForm() {
  const lobbyists = useLobbyists();
  const [number, setNumber] = useState("");
  const [title, setTitle] = useState("");
  const [jurisdiction, setJurisdiction] = useState("");
  const [summary, setSummary] = useState("");
  const [threat, setThreat] = useState<ThreatLevel>("moderate");
  const [status, setStatus] = useState<BillStatus>("introduced");
  const [affects, setAffects] = useState<FeatureArea[]>([]);
  const [sponsors, setSponsors] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [linkedLobbyistIds, setLinked] = useState<string[]>([]);

  function toggle<T>(list: T[], v: T): T[] {
    return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!number.trim() || !title.trim()) return;
    addBill({
      number: number.trim(),
      title: title.trim(),
      jurisdiction: jurisdiction.trim() || "Unknown",
      summary: summary.trim(),
      threat,
      status,
      affects,
      sponsors: sponsors.split(",").map((s) => s.trim()).filter(Boolean),
      sourceUrl: sourceUrl.trim() || undefined,
      linkedLobbyistIds,
    });
    setNumber("");
    setTitle("");
    setJurisdiction("");
    setSummary("");
    setSponsors("");
    setSourceUrl("");
    setAffects([]);
    setLinked([]);
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="text-lg font-semibold">Add a bill to monitor</h2>
      <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
        <input
          required
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder="Bill number (e.g. TX HB 2451)"
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <input
          value={jurisdiction}
          onChange={(e) => setJurisdiction(e.target.value)}
          placeholder="Jurisdiction (Texas, Federal…)"
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <input
          value={sponsors}
          onChange={(e) => setSponsors(e.target.value)}
          placeholder="Sponsors (comma-separated)"
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as BillStatus)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          {ALL_BILL_STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace("_", " ")}</option>
          ))}
        </select>
        <select
          value={threat}
          onChange={(e) => setThreat(e.target.value as ThreatLevel)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          {ALL_THREAT_LEVELS.map((t) => (
            <option key={t} value={t}>{t} threat</option>
          ))}
        </select>
        <input
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          placeholder="Bill text URL (optional)"
          className="rounded-md border border-border bg-background px-3 py-2 text-sm sm:col-span-2"
        />
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="What does this bill restrict and how does it affect Syncoraconnect?"
          rows={3}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm sm:col-span-2"
        />
        <div className="sm:col-span-2">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Features this bill would limit
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {ALL_FEATURE_AREAS.map((f) => {
              const on = affects.includes(f);
              return (
                <button
                  type="button"
                  key={f}
                  onClick={() => setAffects((p) => toggle(p, f))}
                  className={`rounded-full border px-3 py-1 text-xs ${on ? "border-primary bg-primary/10 text-primary" : "border-border"}`}
                >
                  {featureLabel(f)}
                </button>
              );
            })}
          </div>
        </div>
        <div className="sm:col-span-2">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Link known lobbyists
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {lobbyists.length === 0 && (
              <span className="text-xs text-muted-foreground">No lobbyists yet — add below.</span>
            )}
            {lobbyists.map((l) => {
              const on = linkedLobbyistIds.includes(l.id);
              return (
                <button
                  type="button"
                  key={l.id}
                  onClick={() => setLinked((p) => toggle(p, l.id))}
                  className={`rounded-full border px-3 py-1 text-xs ${on ? "border-primary bg-primary/10 text-primary" : "border-border"}`}
                >
                  {l.name}
                </button>
              );
            })}
          </div>
        </div>
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 sm:col-span-2"
        >
          Add bill
        </button>
      </form>
    </section>
  );
}

function TasksSection({ tasks, bills }: { tasks: OppositionTask[]; bills: Bill[] }) {
  const byBill = new Map(bills.map((b) => [b.id, b]));
  const grouped: Record<TaskStatus, OppositionTask[]> = {
    todo: [],
    in_progress: [],
    blocked: [],
    done: [],
  };
  for (const t of tasks) grouped[t.status].push(t);

  const cols: { key: TaskStatus; label: string }[] = [
    { key: "todo", label: "Todo" },
    { key: "in_progress", label: "In progress" },
    { key: "blocked", label: "Blocked" },
    { key: "done", label: "Done" },
  ];

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Employee review queue</h2>
        <p className="text-xs text-muted-foreground">
          Every task here was generated to oppose a bill threatening a Syncoraconnect feature.
        </p>
      </div>
      <div className="grid gap-3 lg:grid-cols-4">
        {cols.map((c) => (
          <div key={c.key} className="rounded-2xl border border-border bg-card p-3">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold">{c.label}</h3>
              <span className="text-[10px] text-muted-foreground">{grouped[c.key].length}</span>
            </div>
            <ul className="space-y-2">
              {grouped[c.key].length === 0 && (
                <li className="text-xs text-muted-foreground">Nothing here.</li>
              )}
              {grouped[c.key].map((t) => {
                const bill = byBill.get(t.billId);
                return (
                  <li key={t.id} className="rounded-lg border border-border bg-background p-2 text-xs">
                    <div className="font-medium text-sm">{t.title}</div>
                    <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {TASK_KIND_LABELS[t.kind]} {bill ? `· ${bill.number}` : ""}
                    </div>
                    {t.notes && <div className="mt-1 text-muted-foreground">{t.notes}</div>}
                    <input
                      type="text"
                      placeholder="Assignee"
                      defaultValue={t.assignee ?? ""}
                      onBlur={(e) =>
                        updateTask(t.id, { assignee: e.target.value.trim() || undefined })
                      }
                      className="mt-2 w-full rounded border border-border bg-background px-2 py-1 text-[11px]"
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function LobbyistsSection({ lobbyists }: { lobbyists: ReturnType<typeof useLobbyists> }) {
  const [name, setName] = useState("");
  const [firm, setFirm] = useState("");
  const [clients, setClients] = useState("");
  const [jurisdictions, setJurisdictions] = useState("");
  const [contact, setContact] = useState("");
  const [notes, setNotes] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !firm.trim()) return;
    addLobbyist({
      name: name.trim(),
      firm: firm.trim(),
      clients: clients.split(",").map((s) => s.trim()).filter(Boolean),
      jurisdictions: jurisdictions.split(",").map((s) => s.trim()).filter(Boolean),
      contact: contact.trim(),
      notes: notes.trim() || undefined,
    });
    setName(""); setFirm(""); setClients(""); setJurisdictions(""); setContact(""); setNotes("");
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Lobbyist directory</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {lobbyists.map((l) => (
          <article key={l.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold">{l.name}</h3>
                <div className="text-xs text-muted-foreground">{l.firm}</div>
              </div>
              <button
                type="button"
                onClick={() => deleteLobbyist(l.id)}
                className="text-[11px] text-muted-foreground hover:text-red-600"
              >
                remove
              </button>
            </div>
            <div className="mt-2 space-y-1 text-xs">
              <div><span className="text-muted-foreground">Clients:</span> {l.clients.join(", ") || "—"}</div>
              <div><span className="text-muted-foreground">Jurisdictions:</span> {l.jurisdictions.join(", ") || "—"}</div>
              <div><span className="text-muted-foreground">Contact:</span> {l.contact || "—"}</div>
              {l.notes && <div className="mt-1 text-foreground/80">{l.notes}</div>}
            </div>
          </article>
        ))}
      </div>

      <form onSubmit={submit} className="grid gap-3 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2">
        <h3 className="text-sm font-semibold sm:col-span-2">Add lobbyist</h3>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
        <input value={firm} onChange={(e) => setFirm(e.target.value)} placeholder="Firm / Organization" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
        <input value={clients} onChange={(e) => setClients(e.target.value)} placeholder="Clients (comma separated)" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
        <input value={jurisdictions} onChange={(e) => setJurisdictions(e.target.value)} placeholder="Jurisdictions (comma separated)" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
        <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Contact (email/phone)" className="rounded-md border border-border bg-background px-3 py-2 text-sm sm:col-span-2" />
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (alignment, history, leverage…)" rows={2} className="rounded-md border border-border bg-background px-3 py-2 text-sm sm:col-span-2" />
        <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 sm:col-span-2">
          Add lobbyist
        </button>
      </form>
    </section>
  );
}