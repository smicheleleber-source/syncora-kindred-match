import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  addComplaint,
  alignmentForClient,
  CATEGORY_LABEL,
  daysUntil,
  STATUS_LABEL,
  updateComplaintStatus,
  useJudges,
  type AlignmentLevel,
  type Complaint,
  type ComplaintStatus,
} from "@/lib/judges-store";

export const Route = createFileRoute("/judges")({
  head: () => ({
    meta: [
      { title: "Judges, Complaints & Selection Calendar — Syncora Connect" },
      {
        name: "description",
        content:
          "Track complaints against judges, follow their status, and align upcoming elections or appointments with your client's case timeline.",
      },
    ],
  }),
  component: JudgesPage,
});

const ALIGN_COLOR: Record<AlignmentLevel, string> = {
  high: "bg-destructive/15 text-destructive border-destructive/30",
  medium: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  low: "bg-muted text-muted-foreground border-border",
  none: "bg-muted text-muted-foreground border-border",
};

const STATUS_COLOR: Record<ComplaintStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-blue-500/15 text-blue-700",
  under_review: "bg-amber-500/15 text-amber-700",
  dismissed: "bg-muted text-muted-foreground",
  sanctioned: "bg-destructive/15 text-destructive",
  withdrawn: "bg-muted text-muted-foreground",
};

function JudgesPage() {
  const { judges, complaints } = useJudges();
  const [practiceArea, setPracticeArea] = useState("family");
  const [expectedResolutionISO, setExpectedResolutionISO] = useState("");
  const [selectedJudge, setSelectedJudge] = useState<string | null>(
    judges[0]?.id ?? null,
  );

  const ranked = useMemo(() => {
    return judges
      .map((j) => ({
        judge: j,
        alignment: alignmentForClient(j, {
          practiceArea,
          expectedResolutionISO: expectedResolutionISO || undefined,
        }),
        complaintCount: complaints.filter((c) => c.judgeId === j.id).length,
      }))
      .sort((a, b) => {
        const order: Record<AlignmentLevel, number> = {
          high: 0,
          medium: 1,
          low: 2,
          none: 3,
        };
        return order[a.alignment.level] - order[b.alignment.level];
      });
  }, [judges, complaints, practiceArea, expectedResolutionISO]);

  const judge = judges.find((j) => j.id === selectedJudge) ?? null;
  const judgeComplaints = complaints.filter((c) => c.judgeId === selectedJudge);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-lg font-semibold">
            Syncora Connect
          </Link>
          <span className="text-sm text-muted-foreground">
            Judicial accountability & selection calendar
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <section className="rounded-2xl border border-border bg-card p-5">
          <h1 className="text-2xl font-semibold">Align your client's situation</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Surface judges whose elections, retentions, or appointments could
            change before your client's matter resolves.
          </p>
          <div className="mt-4 flex flex-wrap gap-4">
            <label className="text-sm">
              Practice area
              <select
                value={practiceArea}
                onChange={(e) => setPracticeArea(e.target.value)}
                className="ml-2 rounded border border-border bg-background px-2 py-1"
              >
                {["family", "criminal", "civil", "probate", "ip", "elder"].map(
                  (p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ),
                )}
              </select>
            </label>
            <label className="text-sm">
              Expected resolution
              <input
                type="date"
                value={expectedResolutionISO}
                onChange={(e) => setExpectedResolutionISO(e.target.value)}
                className="ml-2 rounded border border-border bg-background px-2 py-1"
              />
            </label>
          </div>
        </section>

        <section className="mt-6 grid gap-6 md:grid-cols-[1fr_1.2fr]">
          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Judges
            </h2>
            {ranked.map(({ judge: j, alignment, complaintCount }) => (
              <button
                key={j.id}
                onClick={() => setSelectedJudge(j.id)}
                className={`w-full rounded-2xl border bg-card p-4 text-left transition ${selectedJudge === j.id ? "border-primary" : "border-border hover:border-primary/40"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{j.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {j.court} · {j.jurisdiction}
                    </div>
                  </div>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs font-medium ${ALIGN_COLOR[alignment.level]}`}
                  >
                    {alignment.level} alignment
                  </span>
                </div>
                {j.nextEvent && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Next: <strong className="capitalize">{j.nextEvent.type}</strong>{" "}
                    on {j.nextEvent.dateISO} ({daysUntil(j.nextEvent.dateISO)}d)
                  </div>
                )}
                <div className="mt-1 text-xs text-muted-foreground">
                  {complaintCount} complaint{complaintCount === 1 ? "" : "s"} on file
                </div>
                <div className="mt-2 text-xs italic text-muted-foreground">
                  {alignment.reason}
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {j.practiceAreas.map((a) => {
                    const validated = (j.validated_practice_areas ?? []).includes(a);
                    return (
                      <span
                        key={a}
                        className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                        title={
                          validated
                            ? "Validated by Syncora"
                            : "Claimed — pending validation"
                        }
                      >
                        <span
                          className={
                            validated ? "text-emerald-600" : "text-amber-600"
                          }
                        >
                          {validated ? "✓" : "◷"}
                        </span>
                        {a}
                      </span>
                    );
                  })}
                </div>
              </button>
            ))}
          </div>

          <div>
            {judge ? (
              <JudgeDetail
                judgeId={judge.id}
                judgeName={judge.name}
                complaints={judgeComplaints}
              />
            ) : (
              <p className="text-sm text-muted-foreground">Select a judge.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function JudgeDetail({
  judgeId,
  judgeName,
  complaints,
}: {
  judgeId: string;
  judgeName: string;
  complaints: Complaint[];
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    category: "delay" as Complaint["category"],
    summary: "",
    privateNotes: "",
    caseRef: "",
    oversightBody: "",
    trackingNumber: "",
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.summary.trim()) return;
    addComplaint({
      judgeId,
      clientId: "demo-client",
      caseRef: form.caseRef,
      category: form.category,
      summary: form.summary,
      privateNotes: form.privateNotes,
      oversightBody: form.oversightBody || undefined,
      trackingNumber: form.trackingNumber || undefined,
      status: "submitted",
    });
    setForm({
      category: "delay",
      summary: "",
      privateNotes: "",
      caseRef: "",
      oversightBody: "",
      trackingNumber: "",
    });
    setOpen(false);
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{judgeName} — complaints</h2>
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
        >
          {open ? "Cancel" : "File complaint"}
        </button>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Public summary is shown on the judge profile. Client identity, case
        reference, and private notes stay confidential.
      </p>

      {open && (
        <form
          onSubmit={submit}
          className="mt-4 space-y-3 rounded-xl border border-border bg-background p-4"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              Category
              <select
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value as Complaint["category"] })
                }
                className="mt-1 w-full rounded border border-border bg-background px-2 py-1"
              >
                {Object.entries(CATEGORY_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Case ref (private)
              <input
                value={form.caseRef}
                onChange={(e) => setForm({ ...form, caseRef: e.target.value })}
                className="mt-1 w-full rounded border border-border bg-background px-2 py-1"
              />
            </label>
            <label className="text-sm">
              Oversight body
              <input
                value={form.oversightBody}
                onChange={(e) =>
                  setForm({ ...form, oversightBody: e.target.value })
                }
                placeholder="e.g. State Commission on Judicial Conduct"
                className="mt-1 w-full rounded border border-border bg-background px-2 py-1"
              />
            </label>
            <label className="text-sm">
              Tracking #
              <input
                value={form.trackingNumber}
                onChange={(e) =>
                  setForm({ ...form, trackingNumber: e.target.value })
                }
                className="mt-1 w-full rounded border border-border bg-background px-2 py-1"
              />
            </label>
          </div>
          <label className="block text-sm">
            Public summary
            <textarea
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              rows={3}
              className="mt-1 w-full rounded border border-border bg-background px-2 py-1"
            />
          </label>
          <label className="block text-sm">
            Private notes
            <textarea
              value={form.privateNotes}
              onChange={(e) => setForm({ ...form, privateNotes: e.target.value })}
              rows={3}
              className="mt-1 w-full rounded border border-border bg-background px-2 py-1"
            />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground"
          >
            Submit
          </button>
        </form>
      )}

      <ul className="mt-4 space-y-3">
        {complaints.length === 0 && (
          <li className="text-sm text-muted-foreground">No complaints yet.</li>
        )}
        {complaints.map((c) => (
          <li
            key={c.id}
            className="rounded-xl border border-border bg-background p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-sm font-semibold">
                  {CATEGORY_LABEL[c.category]}
                </div>
                <div className="text-xs text-muted-foreground">
                  Filed {c.filedISO} · updated {c.lastUpdateISO}
                  {c.trackingNumber ? ` · #${c.trackingNumber}` : ""}
                </div>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[c.status]}`}
              >
                {STATUS_LABEL[c.status]}
              </span>
            </div>
            <p className="mt-2 text-sm">{c.summary}</p>
            {c.oversightBody && (
              <p className="mt-1 text-xs text-muted-foreground">
                Filed with: {c.oversightBody}
              </p>
            )}
            <details className="mt-2 text-xs">
              <summary className="cursor-pointer text-muted-foreground">
                Private notes (professional only)
              </summary>
              <p className="mt-1 whitespace-pre-wrap text-foreground">
                Case ref: {c.caseRef || "—"}
                {"\n"}
                {c.privateNotes || "—"}
              </p>
            </details>
            <div className="mt-2 flex flex-wrap gap-1">
              {(
                [
                  "draft",
                  "submitted",
                  "under_review",
                  "dismissed",
                  "sanctioned",
                  "withdrawn",
                ] as ComplaintStatus[]
              ).map((s) => (
                <button
                  key={s}
                  onClick={() => updateComplaintStatus(c.id, s)}
                  className={`rounded-full border px-2 py-0.5 text-xs ${c.status === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
                >
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}