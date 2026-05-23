import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth } from "@/lib/auth";
import { PortalShell } from "./employee";

export const Route = createFileRoute("/employee/tasks")({
  head: () => ({
    meta: [
      { title: "Task Queue — Employee Portal" },
      {
        name: "description",
        content:
          "Personal task queue for Syncora employees: intake reviews, follow-ups, escalations, and risk-mitigation tasks.",
      },
    ],
  }),
  component: () => (
    <RequireAuth roles={["admin", "approver", "preparer", "auditor", "viewer"]}>
      <PortalShell>
        <TaskQueuePage />
      </PortalShell>
    </RequireAuth>
  ),
});

type Priority = "low" | "normal" | "high" | "urgent";
type Status = "open" | "in_progress" | "blocked" | "done";

type Task = {
  id: string;
  title: string;
  category: string;
  priority: Priority;
  status: Status;
  due: string;
  assignee: string;
  notes: string;
  created_at: number;
};

const KEY = "syncora.employee.tasks.v1";
const CATEGORIES = ["Intake review", "Provider validation", "Judge validation", "Risk flag", "Court doc", "Client follow-up", "Other"];
const PRIORITIES: Priority[] = ["low", "normal", "high", "urgent"];
const STATUSES: Status[] = ["open", "in_progress", "blocked", "done"];

function load(): Task[] {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Task[]) : SEED;
  } catch {
    return SEED;
  }
}
function save(t: Task[]) {
  try { localStorage.setItem(KEY, JSON.stringify(t)); } catch { /* noop */ }
}

const SEED: Task[] = [
  { id: "s1", title: "Validate Marlowe Legal — IP specialty claim", category: "Provider validation", priority: "high", status: "open", due: isoOffset(2), assignee: "unassigned", notes: "Confirm 5+ years of issued patents.", created_at: Date.now() - 86400000 },
  { id: "s2", title: "Review TRO surfaced in court-doc vault", category: "Risk flag", priority: "urgent", status: "in_progress", due: isoOffset(0), assignee: "me", notes: "Client Avery Lin — needs same-day callback.", created_at: Date.now() - 3600000 * 6 },
  { id: "s3", title: "Follow up: Northgate intake (no response 5d)", category: "Client follow-up", priority: "normal", status: "open", due: isoOffset(1), assignee: "me", notes: "", created_at: Date.now() - 86400000 * 5 },
];

function isoOffset(days: number) {
  return new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
}

function TaskQueuePage() {
  const { profile } = useAuth();
  const me = profile?.email ?? "me";
  const [tasks, setTasks] = useState<Task[]>(() => load());
  const [filter, setFilter] = useState<"mine" | "all" | "open" | "urgent">("mine");

  const visible = useMemo(() => {
    const list = tasks.slice().sort((a, b) => {
      const order = { urgent: 0, high: 1, normal: 2, low: 3 } as const;
      const p = order[a.priority] - order[b.priority];
      return p !== 0 ? p : a.due.localeCompare(b.due);
    });
    if (filter === "mine") return list.filter((t) => t.assignee === me || t.assignee === "me");
    if (filter === "open") return list.filter((t) => t.status !== "done");
    if (filter === "urgent") return list.filter((t) => t.priority === "urgent");
    return list;
  }, [tasks, filter, me]);

  function persist(next: Task[]) {
    setTasks(next);
    save(next);
  }
  function patch(id: string, p: Partial<Task>) {
    persist(tasks.map((t) => (t.id === id ? { ...t, ...p } : t)));
  }
  function remove(id: string) {
    persist(tasks.filter((t) => t.id !== id));
  }

  const counts = {
    mine: tasks.filter((t) => (t.assignee === me || t.assignee === "me") && t.status !== "done").length,
    open: tasks.filter((t) => t.status !== "done").length,
    urgent: tasks.filter((t) => t.priority === "urgent" && t.status !== "done").length,
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">Task queue</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Personal and team workflow items. Sorted by priority then due date. Status changes are logged.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {[
          { k: "mine", label: `Mine open (${counts.mine})` },
          { k: "open", label: `All open (${counts.open})` },
          { k: "urgent", label: `Urgent (${counts.urgent})` },
          { k: "all", label: "All" },
        ].map((f) => (
          <button
            key={f.k}
            type="button"
            onClick={() => setFilter(f.k as typeof filter)}
            className={
              "rounded-full border px-3 py-1 text-xs " +
              (filter === f.k
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground")
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      <NewTaskForm onAdd={(t) => persist([...tasks, t])} me={me} />

      <ul className="mt-6 divide-y divide-border rounded-2xl border border-border bg-card">
        {visible.map((t) => (
          <li key={t.id} className="grid gap-2 p-4 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <PriorityPill p={t.priority} />
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{t.category}</span>
                <span className="text-xs text-muted-foreground">due {t.due}</span>
                {t.assignee !== "unassigned" && (
                  <span className="text-xs text-muted-foreground">· {t.assignee === "me" ? me : t.assignee}</span>
                )}
              </div>
              <div className={"mt-1 text-sm " + (t.status === "done" ? "text-muted-foreground line-through" : "text-foreground")}>
                {t.title}
              </div>
              {t.notes && <p className="mt-1 text-xs text-muted-foreground">{t.notes}</p>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={t.status}
                onChange={(e) => patch(t.id, { status: e.target.value as Status })}
                className="rounded-full border border-border bg-background px-2 py-1 text-xs"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s.replace("_", " ")}</option>
                ))}
              </select>
              <select
                value={t.assignee === me ? "me" : t.assignee}
                onChange={(e) => patch(t.id, { assignee: e.target.value === "me" ? me : e.target.value })}
                className="rounded-full border border-border bg-background px-2 py-1 text-xs"
              >
                <option value="me">Me</option>
                <option value="unassigned">Unassigned</option>
              </select>
              <button
                type="button"
                onClick={() => remove(t.id)}
                className="rounded-full border border-destructive/30 px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
        {visible.length === 0 && <li className="p-6 text-sm text-muted-foreground">No tasks match this filter.</li>}
      </ul>
    </div>
  );
}

function PriorityPill({ p }: { p: Priority }) {
  const map: Record<Priority, string> = {
    urgent: "bg-destructive/15 text-destructive ring-1 ring-destructive/40",
    high: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    normal: "bg-primary/10 text-primary",
    low: "bg-muted text-muted-foreground",
  };
  return <span className={"rounded-full px-2 py-0.5 text-xs font-medium capitalize " + map[p]}>{p}</span>;
}

function NewTaskForm({ onAdd, me }: { onAdd: (t: Task) => void; me: string }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [priority, setPriority] = useState<Priority>("normal");
  const [due, setDue] = useState(isoOffset(1));
  const [notes, setNotes] = useState("");
  const [assignToMe, setAssignToMe] = useState(true);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({
      id: Math.random().toString(36).slice(2, 10),
      title: title.trim(),
      category,
      priority,
      status: "open",
      due,
      assignee: assignToMe ? me : "unassigned",
      notes: notes.trim(),
      created_at: Date.now(),
    });
    setTitle("");
    setNotes("");
  }

  return (
    <form onSubmit={submit} className="mt-6 grid gap-3 rounded-2xl border border-border bg-card p-5 md:grid-cols-6">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="New task title"
        className="md:col-span-3 rounded-md border border-border bg-background px-3 py-1.5 text-sm"
      />
      <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-md border border-border bg-background px-3 py-1.5 text-sm">
        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="rounded-md border border-border bg-background px-3 py-1.5 text-sm">
        {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
      </select>
      <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="rounded-md border border-border bg-background px-3 py-1.5 text-sm" />
      <input
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes (optional)"
        className="md:col-span-4 rounded-md border border-border bg-background px-3 py-1.5 text-sm"
      />
      <label className="flex items-center gap-2 text-xs text-muted-foreground md:col-span-1">
        <input type="checkbox" checked={assignToMe} onChange={(e) => setAssignToMe(e.target.checked)} />
        Assign to me
      </label>
      <button type="submit" className="md:col-span-1 rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground">
        Add task
      </button>
    </form>
  );
}
