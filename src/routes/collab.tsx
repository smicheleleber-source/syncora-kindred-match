import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  addComment,
  addDecision,
  createDoc,
  DECLINE_REASON_LABEL,
  DRAFT_STATUS_LABEL,
  removeDecision,
  removeDoc,
  saveRevision,
  updateDoc,
  useCollabDocs,
  type CollabDoc,
  type DeclineReason,
  type DecisionKind,
  type DraftStatus,
} from "@/lib/collab-docs";

export const Route = createFileRoute("/collab")({
  head: () => ({
    meta: [
      { title: "Document collaboration — Syncora Connect" },
      {
        name: "description",
        content:
          "Collaborate on legal documents and capture the reasoning behind every professional decision — including why items were declined or held for later.",
      },
    ],
  }),
  component: CollabPage,
});

const KIND_OPTIONS = [
  "Motion for Summary Judgment",
  "Motion to Dismiss",
  "Complaint draft",
  "Answer & affirmative defenses",
  "Appellate brief",
  "Discovery request",
  "Demand letter",
  "Settlement memo",
  "Other",
];

const ROLE_OPTIONS = [
  "Lead counsel",
  "Co-counsel",
  "Senior associate",
  "Paralegal",
  "Client",
  "Expert",
  "Investigator",
];

const STATUS_OPTIONS: DraftStatus[] = ["draft", "in_review", "approved", "filed", "archived"];

function CollabPage() {
  const docs = useCollabDocs();
  const [selectedId, setSelectedId] = useState<string | null>(docs[0]?.id ?? null);
  const selected = useMemo(
    () => docs.find((d) => d.id === selectedId) ?? docs[0] ?? null,
    [docs, selectedId],
  );

  const [newTitle, setNewTitle] = useState("");
  const [newKind, setNewKind] = useState(KIND_OPTIONS[0]);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const d = createDoc({ title: newTitle.trim(), kind: newKind });
    setSelectedId(d.id);
    setNewTitle("");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <Link to="/" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-primary">
              ← Syncora Connect
            </Link>
            <h1 className="text-2xl font-semibold mt-1">Document collaboration & decision log</h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Co-draft motions, briefs, and letters. Capture every professional decision — including
              <em> why</em> items were declined ("not legally fit", "hold for later") so the reasoning stays with the case.
            </p>
          </div>
          <div className="flex gap-2 text-sm">
            <Link to="/playbooks/matrix" className="rounded-full border border-border px-3 py-1.5 hover:border-primary/40 hover:text-primary">
              Litigation matrix →
            </Link>
            <Link to="/playbooks/litigation" className="rounded-full border border-border px-3 py-1.5 hover:border-primary/40 hover:text-primary">
              Playbook →
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-4">
          <form onSubmit={handleCreate} className="rounded-xl border border-border bg-card p-4 space-y-3">
            <h2 className="font-medium text-sm">New document</h2>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Document title"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <select
              value={newKind}
              onChange={(e) => setNewKind(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              {KIND_OPTIONS.map((k) => <option key={k}>{k}</option>)}
            </select>
            <button
              type="submit"
              className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Start drafting
            </button>
          </form>

          <div className="rounded-xl border border-border bg-card divide-y divide-border">
            {docs.map((d) => {
              const declined = d.decisions.filter((x) => x.kind === "decline").length;
              const held = d.decisions.filter((x) => x.kind === "revisit").length;
              const active = selected?.id === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => setSelectedId(d.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-muted/50 ${active ? "bg-muted" : ""}`}
                >
                  <div className="text-sm font-medium truncate">{d.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{d.kind}</div>
                  <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
                    <span className="rounded-full border border-border px-2 py-0.5">
                      {DRAFT_STATUS_LABEL[d.status]}
                    </span>
                    {declined > 0 && (
                      <span className="rounded-full bg-destructive/10 text-destructive px-2 py-0.5">
                        {declined} declined
                      </span>
                    )}
                    {held > 0 && (
                      <span className="rounded-full bg-accent/15 text-accent-foreground px-2 py-0.5">
                        {held} held
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
            {docs.length === 0 && (
              <div className="p-4 text-sm text-muted-foreground">No documents yet.</div>
            )}
          </div>
        </aside>

        {selected ? <DocPanel key={selected.id} doc={selected} /> : (
          <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
            Create a document to start collaborating.
          </div>
        )}
      </main>
    </div>
  );
}

function DocPanel({ doc }: { doc: CollabDoc }) {
  const [body, setBody] = useState(doc.body);
  const [revAuthor, setRevAuthor] = useState(ROLE_OPTIONS[0]);
  const [revSummary, setRevSummary] = useState("");

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <input
            value={doc.title}
            onChange={(e) => updateDoc(doc.id, { title: e.target.value })}
            className="text-xl font-semibold bg-transparent border-b border-transparent hover:border-border focus:border-primary outline-none w-full max-w-md"
          />
          <div className="flex items-center gap-2">
            <select
              value={doc.status}
              onChange={(e) => updateDoc(doc.id, { status: e.target.value as DraftStatus })}
              className="rounded-md border border-border bg-background px-2 py-1 text-xs"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{DRAFT_STATUS_LABEL[s]}</option>
              ))}
            </select>
            <button
              onClick={() => {
                if (confirm("Delete this document?")) removeDoc(doc.id);
              }}
              className="text-xs text-muted-foreground hover:text-destructive"
            >
              Delete
            </button>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          {doc.kind} · collaborators: {doc.collaborators.join(", ") || "none yet"}
        </div>

        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={14}
          className="w-full font-mono text-sm rounded-md border border-border bg-background p-3"
          placeholder="Start drafting the document…"
        />

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => updateDoc(doc.id, { body })}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
          >
            Save body
          </button>
          <select
            value={revAuthor}
            onChange={(e) => setRevAuthor(e.target.value)}
            className="rounded-md border border-border bg-background px-2 py-1 text-xs"
          >
            {ROLE_OPTIONS.map((r) => <option key={r}>{r}</option>)}
          </select>
          <input
            value={revSummary}
            onChange={(e) => setRevSummary(e.target.value)}
            placeholder="Revision summary"
            className="flex-1 min-w-[200px] rounded-md border border-border bg-background px-2 py-1 text-xs"
          />
          <button
            onClick={() => {
              if (!revSummary.trim()) return;
              updateDoc(doc.id, { body });
              saveRevision(doc.id, revAuthor, revSummary.trim());
              setRevSummary("");
            }}
            className="rounded-md border border-border px-3 py-1.5 text-xs hover:border-primary/40 hover:text-primary"
          >
            Save revision
          </button>
        </div>
      </div>

      <DecisionsPanel doc={doc} />
      <CommentsPanel doc={doc} />
      <RevisionsPanel doc={doc} />
    </section>
  );
}

function DecisionsPanel({ doc }: { doc: CollabDoc }) {
  const [item, setItem] = useState("");
  const [kind, setKind] = useState<DecisionKind>("decline");
  const [reason, setReason] = useState<DeclineReason>("not_legally_fit");
  const [rationale, setRationale] = useState("");
  const [author, setAuthor] = useState(ROLE_OPTIONS[0]);
  const [revisitOn, setRevisitOn] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!item.trim() || !rationale.trim()) return;
    addDecision(doc.id, {
      item: item.trim(),
      kind,
      reason: kind === "include" ? undefined : reason,
      rationale: rationale.trim(),
      author,
      revisit_on: kind === "revisit" && revisitOn ? revisitOn : undefined,
    });
    setItem("");
    setRationale("");
    setRevisitOn("");
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div>
        <h3 className="font-semibold">Decision log</h3>
        <p className="text-xs text-muted-foreground">
          Record what was considered and the reasoning — including items declined as not legally fit, held for later, or
          dropped for strategic reasons. Future counsel will know <em>why</em>.
        </p>
      </div>

      <form onSubmit={submit} className="grid gap-2 md:grid-cols-2">
        <input
          value={item}
          onChange={(e) => setItem(e.target.value)}
          placeholder="Item considered (claim, exhibit, witness, argument…)"
          className="md:col-span-2 rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as DecisionKind)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="include">Include / pursue</option>
          <option value="decline">Decline</option>
          <option value="revisit">Hold — revisit later</option>
        </select>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value as DeclineReason)}
          disabled={kind === "include"}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm disabled:opacity-50"
        >
          {Object.entries(DECLINE_REASON_LABEL).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          {ROLE_OPTIONS.map((r) => <option key={r}>{r}</option>)}
        </select>
        <input
          type="date"
          value={revisitOn}
          onChange={(e) => setRevisitOn(e.target.value)}
          disabled={kind !== "revisit"}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm disabled:opacity-50"
          title="Revisit on"
        />
        <textarea
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
          placeholder="Rationale — why this decision? Cite the rule, fact, or strategy."
          rows={3}
          className="md:col-span-2 rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="md:col-span-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Log decision
        </button>
      </form>

      <ul className="space-y-2">
        {doc.decisions.length === 0 && (
          <li className="text-sm text-muted-foreground">No decisions logged yet.</li>
        )}
        {doc.decisions.slice().sort((a, b) => b.created_at - a.created_at).map((d) => {
          const tone =
            d.kind === "decline"
              ? "border-destructive/40 bg-destructive/5"
              : d.kind === "revisit"
                ? "border-accent/40 bg-accent/10"
                : "border-primary/30 bg-primary/5";
          return (
            <li key={d.id} className={`rounded-md border p-3 text-sm ${tone}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{d.item}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {d.kind === "include" ? "Include" : d.kind === "decline" ? "Declined" : "Hold — revisit"}
                    {d.reason ? ` · ${DECLINE_REASON_LABEL[d.reason]}` : ""}
                    {" · "}{d.author}
                    {d.revisit_on ? ` · revisit ${d.revisit_on}` : ""}
                  </div>
                </div>
                <button
                  onClick={() => removeDecision(doc.id, d.id)}
                  className="text-xs text-muted-foreground hover:text-destructive"
                >
                  Remove
                </button>
              </div>
              <p className="mt-2 text-sm whitespace-pre-wrap">{d.rationale}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function CommentsPanel({ doc }: { doc: CollabDoc }) {
  const [body, setBody] = useState("");
  const [author, setAuthor] = useState("Lead counsel");
  const [role, setRole] = useState(ROLE_OPTIONS[0]);

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <h3 className="font-semibold">Comments</h3>
      <div className="grid gap-2 md:grid-cols-[1fr_180px_180px]">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Leave a comment for the team…"
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <input
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Your name"
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          {ROLE_OPTIONS.map((r) => <option key={r}>{r}</option>)}
        </select>
      </div>
      <button
        onClick={() => {
          if (!body.trim() || !author.trim()) return;
          addComment(doc.id, { author, role, body: body.trim() });
          setBody("");
        }}
        className="rounded-md border border-border px-3 py-1.5 text-xs hover:border-primary/40 hover:text-primary"
      >
        Post comment
      </button>
      <ul className="space-y-2">
        {doc.comments.length === 0 && (
          <li className="text-sm text-muted-foreground">No comments yet.</li>
        )}
        {doc.comments.slice().sort((a, b) => b.created_at - a.created_at).map((c) => (
          <li key={c.id} className="rounded-md border border-border p-3 text-sm">
            <div className="text-xs text-muted-foreground">
              {c.author} · {c.role} · {new Date(c.created_at).toLocaleString()}
            </div>
            <p className="mt-1 whitespace-pre-wrap">{c.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RevisionsPanel({ doc }: { doc: CollabDoc }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <h3 className="font-semibold">Revision history</h3>
      {doc.revisions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No saved revisions yet.</p>
      ) : (
        <ol className="space-y-2">
          {doc.revisions.slice().sort((a, b) => b.created_at - a.created_at).map((r) => (
            <li key={r.id} className="rounded-md border border-border p-3 text-sm">
              <div className="text-xs text-muted-foreground">
                {r.author} · {new Date(r.created_at).toLocaleString()}
              </div>
              <div className="font-medium mt-1">{r.summary || "(no summary)"}</div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}