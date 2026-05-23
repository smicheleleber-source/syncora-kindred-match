import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  addResponse,
  hasUpvoted,
  setFeedbackStatus,
  submitFeedback,
  toggleUpvote,
  useFeedback,
  type FeedbackItem,
  type FeedbackKind,
  type FeedbackRole,
  type FeedbackStatus,
} from "@/lib/feedback-store";

export const Route = createFileRoute("/feedback")({
  head: () => ({
    meta: [
      { title: "Feedback — Syncora Connect" },
      {
        name: "description",
        content:
          "Suggest improvements, report bugs, and track what the team is shipping. Open to clients and professionals.",
      },
      { property: "og:title", content: "Feedback — Syncora Connect" },
      {
        property: "og:description",
        content:
          "A transparent feedback board: submit ideas, upvote, and follow status from open to shipped.",
      },
    ],
  }),
  component: FeedbackPage,
});

const STATUSES: FeedbackStatus[] = ["open", "reviewing", "planned", "in_progress", "shipped", "declined"];
const KINDS: FeedbackKind[] = ["bug", "improvement", "feature", "praise"];
const ROLES: FeedbackRole[] = ["client", "professional"];

type Filter = "all" | FeedbackStatus;

function FeedbackPage() {
  const items = useFeedback();
  const [tab, setTab] = useState<"browse" | "submit">("browse");
  const [filter, setFilter] = useState<Filter>("all");
  const [roleFilter, setRoleFilter] = useState<"all" | FeedbackRole>("all");
  const [sort, setSort] = useState<"top" | "new">("top");

  const filtered = useMemo(() => {
    const f = items
      .filter((i) => (filter === "all" ? true : i.status === filter))
      .filter((i) => (roleFilter === "all" ? true : i.role === roleFilter));
    return f.sort((a, b) =>
      sort === "top" ? b.upvotes - a.upvotes : b.created_at - a.created_at,
    );
  }, [items, filter, roleFilter, sort]);

  const counts = useMemo(() => {
    const map = new Map<FeedbackStatus, number>();
    for (const i of items) map.set(i.status, (map.get(i.status) ?? 0) + 1);
    return map;
  }, [items]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-primary">Syncora Connect</Link>
            <span>/</span>
            <span className="text-foreground">Feedback</span>
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Feedback & roadmap
          </h1>
          <p className="mt-3 max-w-3xl text-base text-muted-foreground">
            Share what would make Syncora better. Clients and professionals can submit ideas, upvote
            what matters, and follow each item from <em>open</em> to <em>shipped</em>.
          </p>

          <div className="mt-6 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {STATUSES.map((s) => (
              <div key={s} className="rounded-xl border border-border bg-background p-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground capitalize">
                  {s.replace("_", " ")}
                </div>
                <div className="mt-1 text-xl font-semibold text-foreground">{counts.get(s) ?? 0}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 inline-flex rounded-full border border-border bg-background p-1">
            {(["browse", "submit"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={
                  "rounded-full px-4 py-1.5 text-sm font-medium transition " +
                  (tab === t
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground")
                }
              >
                {t === "browse" ? "Browse & vote" : "Submit feedback"}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        {tab === "browse" ? (
          <>
            <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
              <FilterChips
                value={filter}
                onChange={setFilter}
                options={["all", ...STATUSES] as Filter[]}
              />
              <span className="mx-2 h-4 w-px bg-border" />
              <FilterChips
                value={roleFilter}
                onChange={setRoleFilter}
                options={["all", ...ROLES] as Array<"all" | FeedbackRole>}
              />
              <span className="ml-auto inline-flex rounded-full border border-border bg-background p-0.5 text-xs">
                {(["top", "new"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSort(s)}
                    className={
                      "rounded-full px-3 py-1 capitalize " +
                      (sort === s
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground")
                    }
                  >
                    {s === "top" ? "Top voted" : "Newest"}
                  </button>
                ))}
              </span>
            </div>

            <div className="space-y-3">
              {filtered.map((i) => (
                <FeedbackCard key={i.id} item={i} />
              ))}
              {filtered.length === 0 && (
                <p className="text-sm text-muted-foreground">No feedback in this view yet.</p>
              )}
            </div>
          </>
        ) : (
          <SubmitForm onSubmitted={() => setTab("browse")} />
        )}
      </main>
    </div>
  );
}

function FilterChips<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: T[];
}) {
  return (
    <>
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={
            "rounded-full border px-3 py-1 capitalize transition " +
            (value === o
              ? "border-primary bg-primary/5 text-primary"
              : "border-border bg-background text-muted-foreground hover:text-foreground")
          }
        >
          {o.replace("_", " ")}
        </button>
      ))}
    </>
  );
}

function statusTone(s: FeedbackStatus) {
  const map: Record<FeedbackStatus, string> = {
    open: "bg-muted text-muted-foreground",
    reviewing: "bg-primary/10 text-primary",
    planned: "bg-primary/10 text-primary",
    in_progress: "bg-accent/15 text-accent-foreground ring-1 ring-accent/40",
    shipped: "bg-accent/15 text-accent-foreground ring-1 ring-accent/40",
    declined: "bg-destructive/10 text-destructive",
  };
  return map[s];
}

function kindTone(k: FeedbackKind) {
  const map: Record<FeedbackKind, string> = {
    bug: "bg-destructive/10 text-destructive",
    improvement: "bg-primary/10 text-primary",
    feature: "bg-accent/15 text-accent-foreground",
    praise: "bg-muted text-foreground",
  };
  return map[k];
}

function FeedbackCard({ item }: { item: FeedbackItem }) {
  const [open, setOpen] = useState(false);
  const [reply, setReply] = useState("");
  const [staffName, setStaffName] = useState("Syncora team");
  const upvoted = hasUpvoted(item);

  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => toggleUpvote(item.id)}
          aria-pressed={upvoted}
          className={
            "flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border text-sm transition " +
            (upvoted
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-primary")
          }
        >
          <span className="text-xs">▲</span>
          <span className="font-semibold">{item.upvotes}</span>
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={"rounded-full px-2 py-0.5 text-xs font-medium capitalize " + kindTone(item.kind)}>
              {item.kind}
            </span>
            <span className={"rounded-full px-2 py-0.5 text-xs font-medium capitalize " + statusTone(item.status)}>
              {item.status.replace("_", " ")}
            </span>
            <span className="text-xs text-muted-foreground">
              from {item.author_name} · {item.role}
            </span>
            <span className="ml-auto text-xs text-muted-foreground">
              {new Date(item.created_at).toLocaleDateString()}
            </span>
          </div>
          <h3 className="mt-2 text-base font-semibold text-card-foreground">{item.title}</h3>
          <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{item.body}</p>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="text-muted-foreground hover:text-foreground"
            >
              {open ? "Hide thread" : `View thread (${item.responses.length})`}
            </button>
            <span className="ml-auto inline-flex items-center gap-1 text-muted-foreground">
              Update status:
              <select
                value={item.status}
                onChange={(e) => setFeedbackStatus(item.id, e.target.value as FeedbackStatus)}
                className="rounded-full border border-border bg-background px-2 py-0.5"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s.replace("_", " ")}</option>
                ))}
              </select>
            </span>
          </div>

          {open && (
            <div className="mt-4 space-y-3 rounded-xl border border-border bg-background p-4">
              <ul className="space-y-2">
                {item.responses.map((r) => (
                  <li key={r.id} className="text-sm">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{r.author}</span>
                      <span>{new Date(r.at).toLocaleString()}</span>
                    </div>
                    <p className="mt-0.5 text-muted-foreground">{r.message}</p>
                  </li>
                ))}
                {item.responses.length === 0 && (
                  <li className="text-xs text-muted-foreground">No replies yet.</li>
                )}
              </ul>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!reply.trim() || !staffName.trim()) return;
                  addResponse(item.id, staffName.trim(), reply.trim());
                  setReply("");
                }}
                className="flex flex-col gap-2 sm:flex-row"
              >
                <input
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  maxLength={60}
                  placeholder="Your name"
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm sm:w-40"
                />
                <input
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  maxLength={500}
                  placeholder="Reply with an update…"
                  className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                />
                <button
                  type="submit"
                  className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground"
                >
                  Post
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function SubmitForm({ onSubmitted }: { onSubmitted: () => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [kind, setKind] = useState<FeedbackKind>("improvement");
  const [role, setRole] = useState<FeedbackRole>("client");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const t = title.trim();
    const b = body.trim();
    const n = name.trim();
    if (t.length < 6 || t.length > 120) return setError("Title should be 6–120 characters.");
    if (b.length < 20 || b.length > 2000) return setError("Description should be 20–2000 characters.");
    if (n.length < 2 || n.length > 60) return setError("Name should be 2–60 characters.");
    submitFeedback({ title: t, body: b, kind, role, author_name: n });
    setTitle("");
    setBody("");
    setName("");
    onSubmitted();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-2xl space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8"
    >
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Title
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          placeholder="e.g. Email me when my match accepts"
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
        />
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Details
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          maxLength={2000}
          placeholder="What problem are you trying to solve? What would success look like?"
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Type</label>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as FeedbackKind)}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
          >
            {KINDS.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">You are a…</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as FeedbackRole)}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
          />
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Submit feedback
        </button>
        <p className="text-xs text-muted-foreground">
          Posts are public so everyone can see what's being improved.
        </p>
      </div>
    </form>
  );
}