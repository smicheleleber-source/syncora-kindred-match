import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  addReview,
  CASE_CATEGORIES,
  pledge,
  submitCase,
  useCases,
  type CaseCategory,
  type LegalCase,
  type ReviewStatus,
} from "@/lib/cases-store";

export const Route = createFileRoute("/cases")({
  head: () => ({
    meta: [
      { title: "Community Case Review — Syncora Connect" },
      {
        name: "description",
        content:
          "Submit legal cases that need community support, review pending cases, and donate to promote the ones worth fighting.",
      },
      {
        property: "og:title",
        content: "Community Case Review — Syncora Connect",
      },
      {
        property: "og:description",
        content:
          "A community-vetted queue of legal cases. Review the facts, vote to promote, and chip in to fund the ones that matter.",
      },
    ],
  }),
  component: CasesPage,
});

type Tab = "browse" | "submit";

function CasesPage() {
  const cases = useCases();
  const [tab, setTab] = useState<Tab>("browse");
  const [filter, setFilter] = useState<"all" | ReviewStatus>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      cases
        .filter((c) => (filter === "all" ? true : c.status === filter))
        .sort((a, b) => b.created_at - a.created_at),
    [cases, filter],
  );

  const selected = selectedId ? cases.find((c) => c.id === selectedId) ?? null : null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-primary">
              Syncora Connect
            </Link>
            <span>/</span>
            <span className="text-foreground">Community Cases</span>
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Community case review
          </h1>
          <p className="mt-3 max-w-3xl text-base text-muted-foreground">
            Submit a legal case that needs help. The community reviews the facts, votes
            to promote the ones worth fighting, and chips in to fund them.
          </p>
          <div className="mt-6 inline-flex rounded-full border border-border bg-background p-1">
            {(["browse", "submit"] as Tab[]).map((t) => (
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
                {t === "browse" ? "Browse & review" : "Submit a case"}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        {tab === "browse" ? (
          <>
            <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
              {(["all", "pending", "approved", "flagged"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={
                    "rounded-full border px-3 py-1 capitalize transition " +
                    (filter === f
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-background text-muted-foreground hover:text-foreground")
                  }
                >
                  {f}
                </button>
              ))}
              <span className="ml-auto text-xs text-muted-foreground">
                {filtered.length} case{filtered.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {filtered.map((c) => (
                <CaseCard key={c.id} c={c} onOpen={() => setSelectedId(c.id)} />
              ))}
              {filtered.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No cases in this view yet.
                </p>
              )}
            </div>
          </>
        ) : (
          <SubmitForm onSubmitted={() => setTab("browse")} />
        )}
      </main>

      {selected && (
        <CaseDrawer c={selected} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}

function statusBadge(s: ReviewStatus) {
  const styles: Record<ReviewStatus, string> = {
    pending: "border-border bg-muted text-muted-foreground",
    approved: "border-primary/30 bg-primary/10 text-primary",
    flagged: "border-destructive/30 bg-destructive/10 text-destructive",
  };
  return styles[s];
}

function CaseCard({ c, onOpen }: { c: LegalCase; onOpen: () => void }) {
  const pct = Math.min(100, Math.round((c.raised_amount / c.goal_amount) * 100));
  return (
    <button
      type="button"
      onClick={onOpen}
      className="rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition hover:border-primary/40"
    >
      <div className="flex items-center gap-2">
        <span
          className={
            "rounded-full border px-2 py-0.5 text-xs font-medium capitalize " +
            statusBadge(c.status)
          }
        >
          {c.status}
        </span>
        <span className="text-xs text-muted-foreground">{c.category}</span>
        <span className="ml-auto text-xs text-muted-foreground">{c.location}</span>
      </div>
      <h3 className="mt-3 text-base font-semibold text-card-foreground">{c.title}</h3>
      <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{c.summary}</p>
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            ${c.raised_amount.toLocaleString()} of ${c.goal_amount.toLocaleString()}
          </span>
          <span>
            {c.reviews.length} review{c.reviews.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </button>
  );
}

function CaseDrawer({ c, onClose }: { c: LegalCase; onClose: () => void }) {
  const [reviewerName, setReviewerName] = useState("");
  const [vote, setVote] = useState<"promote" | "needs_work" | "reject">("promote");
  const [note, setNote] = useState("");
  const [amount, setAmount] = useState(50);
  const [thanks, setThanks] = useState<string | null>(null);

  function postReview(e: React.FormEvent) {
    e.preventDefault();
    if (!reviewerName.trim() || !note.trim()) return;
    addReview(c.id, { reviewer_name: reviewerName.trim(), vote, note: note.trim() });
    setReviewerName("");
    setNote("");
  }

  function postPledge() {
    if (amount <= 0) return;
    pledge(c.id, amount);
    setThanks(`Pledged $${amount} to "${c.title}".`);
    setTimeout(() => setThanks(null), 3500);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-foreground/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <aside
        className="h-full w-full max-w-xl overflow-y-auto bg-background p-6 shadow-2xl md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <span
              className={
                "rounded-full border px-2 py-0.5 text-xs font-medium capitalize " +
                statusBadge(c.status)
              }
            >
              {c.status}
            </span>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">{c.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {c.category} · {c.location} · submitted by {c.submitter_name} (
              {c.submitter_role})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border bg-background px-3 py-1 text-sm text-muted-foreground hover:text-foreground"
          >
            Close
          </button>
        </div>

        <p className="mt-5 whitespace-pre-line text-sm text-foreground">{c.summary}</p>

        <section className="mt-6 rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-card-foreground">Donate to promote</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Funds go toward legal costs and amplifying this case in the directory.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {[25, 50, 100, 250].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setAmount(v)}
                className={
                  "rounded-full border px-3 py-1 text-sm " +
                  (amount === v
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:text-foreground")
                }
              >
                ${v}
              </button>
            ))}
            <input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
              className="w-24 rounded-md border border-border bg-background px-2 py-1 text-sm"
            />
            <button
              type="button"
              onClick={postPledge}
              className="ml-auto rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Pledge ${amount}
            </button>
          </div>
          {thanks && (
            <p className="mt-3 text-xs font-medium text-primary">{thanks}</p>
          )}
        </section>

        <section className="mt-6">
          <h3 className="text-sm font-semibold text-foreground">
            Community reviews ({c.reviews.length})
          </h3>
          <ul className="mt-3 space-y-3">
            {c.reviews.map((r) => (
              <li
                key={r.id}
                className="rounded-lg border border-border bg-card p-3 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-card-foreground">
                    {r.reviewer_name}
                  </span>
                  <span
                    className={
                      "rounded-full px-2 py-0.5 text-xs " +
                      (r.vote === "promote"
                        ? "bg-primary/10 text-primary"
                        : r.vote === "reject"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-muted text-muted-foreground")
                    }
                  >
                    {r.vote.replace("_", " ")}
                  </span>
                </div>
                <p className="mt-1 text-muted-foreground">{r.note}</p>
              </li>
            ))}
            {c.reviews.length === 0 && (
              <li className="text-sm text-muted-foreground">
                No reviews yet — be the first.
              </li>
            )}
          </ul>

          <form onSubmit={postReview} className="mt-5 space-y-3 rounded-xl border border-border bg-card p-4">
            <h4 className="text-sm font-semibold text-card-foreground">Add a review</h4>
            <input
              type="text"
              placeholder="Your name (or pseudonym)"
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <div className="flex flex-wrap gap-2 text-sm">
              {(["promote", "needs_work", "reject"] as const).map((v) => (
                <label
                  key={v}
                  className={
                    "cursor-pointer rounded-full border px-3 py-1 capitalize " +
                    (vote === v
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground")
                  }
                >
                  <input
                    type="radio"
                    name="vote"
                    value={v}
                    checked={vote === v}
                    onChange={() => setVote(v)}
                    className="sr-only"
                  />
                  {v.replace("_", " ")}
                </label>
              ))}
            </div>
            <textarea
              placeholder="What stood out? Anything that should be verified?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Post review
            </button>
          </form>
        </section>
      </aside>
    </div>
  );
}

function SubmitForm({ onSubmitted }: { onSubmitted: () => void }) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState<CaseCategory>("Civil Rights");
  const [location, setLocation] = useState("");
  const [submitterName, setSubmitterName] = useState("");
  const [submitterRole, setSubmitterRole] =
    useState<LegalCase["submitter_role"]>("client");
  const [goal, setGoal] = useState(5000);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (title.trim().length < 8) return setError("Give the case a clearer title.");
    if (summary.trim().length < 40)
      return setError("Summary should be at least 40 characters.");
    if (!location.trim()) return setError("Add a city/state.");
    if (!submitterName.trim()) return setError("Add your name.");
    if (goal < 100) return setError("Goal must be at least $100.");
    submitCase({
      title: title.trim(),
      summary: summary.trim(),
      category,
      location: location.trim(),
      submitter_name: submitterName.trim(),
      submitter_role: submitterRole,
      goal_amount: goal,
    });
    onSubmitted();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-2xl space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8"
    >
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Case title
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Wrongful eviction of disabled tenant"
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
        />
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          What happened?
        </label>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={5}
          placeholder="Facts, current posture, deadlines, what the funds will cover."
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as CaseCategory)}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
          >
            {CASE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Location
          </label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City, State"
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Your name
          </label>
          <input
            value={submitterName}
            onChange={(e) => setSubmitterName(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            You are the…
          </label>
          <select
            value={submitterRole}
            onChange={(e) =>
              setSubmitterRole(e.target.value as LegalCase["submitter_role"])
            }
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
          >
            <option value="client">Client / affected person</option>
            <option value="advocate">Advocate / family member</option>
            <option value="attorney">Attorney / firm</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Funding goal (USD)
          </label>
          <input
            type="number"
            min={100}
            value={goal}
            onChange={(e) => setGoal(Number(e.target.value) || 0)}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
          />
        </div>
      </div>
      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          New submissions enter "pending" until two reviewers vote to promote.
        </p>
        <button
          type="submit"
          className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Submit for review
        </button>
      </div>
    </form>
  );
}