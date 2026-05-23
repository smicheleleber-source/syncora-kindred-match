import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/court-docs")({
  head: () => ({
    meta: [
      { title: "Court Document Vault & Risk Mitigation — Syncora Connect" },
      {
        name: "description",
        content:
          "Upload orders, motions, and filings from court. Get an automated risk assessment with deadlines, compliance items, and appeal windows flagged.",
      },
      { property: "og:title", content: "Court Document Vault — Syncora Connect" },
      {
        property: "og:description",
        content:
          "Securely log court orders and get a risk-mitigation breakdown: deadlines, compliance, appeal windows.",
      },
    ],
  }),
  component: CourtDocsPage,
});

const DOC_TYPES = [
  "Order",
  "Temporary Restraining Order",
  "Injunction",
  "Judgment",
  "Custody Order",
  "Eviction / Writ of Possession",
  "Subpoena",
  "Summons & Complaint",
  "Motion",
  "Discovery Request",
  "Notice of Hearing",
  "Other",
] as const;
type DocType = (typeof DOC_TYPES)[number];

type Severity = "critical" | "high" | "medium" | "low" | "info";

type RiskFlag = {
  severity: Severity;
  title: string;
  detail: string;
  mitigation: string;
};

type CourtDoc = {
  id: string;
  filename: string;
  size: number;
  mime: string;
  doc_type: DocType;
  case_caption: string;
  court: string;
  docket: string;
  date_filed: string; // ISO yyyy-mm-dd
  deadline?: string; // ISO yyyy-mm-dd
  notes: string;
  text_excerpt: string;
  uploaded_at: number;
  data_url?: string; // small files only — we'll skip storing data to avoid quota
  risk_score: number; // 0–100
  flags: RiskFlag[];
};

const KEY = "syncora_court_docs_v1";

function loadDocs(): CourtDoc[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CourtDoc[]) : [];
  } catch {
    return [];
  }
}
function saveDocs(docs: CourtDoc[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(docs));
  } catch {}
}

// ---------- Risk heuristics ----------
const RULES: { pattern: RegExp; flag: Omit<RiskFlag, "detail"> & { detail?: string } }[] = [
  {
    pattern: /\b(ex\s*parte|temporary restraining order|TRO)\b/i,
    flag: {
      severity: "critical",
      title: "Ex parte / TRO detected",
      detail: "Order issued without the other party present — short fuse to respond.",
      mitigation:
        "Calendar the show-cause hearing immediately and prepare a motion to dissolve or modify within the response window (often 14 days).",
    },
  },
  {
    pattern: /\b(stay away|no contact|protective order|restraining order)\b/i,
    flag: {
      severity: "critical",
      title: "No-contact / protective provisions",
      detail: "Violation can trigger contempt or criminal charges.",
      mitigation:
        "Cut all direct and indirect contact (incl. social media, third parties). Route any necessary communication through counsel only.",
    },
  },
  {
    pattern: /\b(custody|parenting time|visitation|child support)\b/i,
    flag: {
      severity: "high",
      title: "Custody / support terms",
      detail: "Custody and support orders are strictly enforced; arrears accrue interest.",
      mitigation:
        "Set automatic payments, document every exchange, and request modification in writing before deviating.",
    },
  },
  {
    pattern: /\b(writ of possession|eviction|forcible detainer|lockout)\b/i,
    flag: {
      severity: "critical",
      title: "Eviction / writ of possession",
      detail: "Sheriff lockout can occur within days of the writ issuing.",
      mitigation:
        "File any supersedeas/stay motion immediately, document habitability defenses, and coordinate move-out logistics in parallel.",
    },
  },
  {
    pattern: /\b(judgment|judgement|award of)\b/i,
    flag: {
      severity: "high",
      title: "Money judgment entered",
      detail: "Subject to garnishment, liens, and post-judgment interest.",
      mitigation:
        "Note the appeal window (often 30 days), evaluate satisfaction/settlement, and protect exempt assets.",
    },
  },
  {
    pattern: /\b(subpoena|duces tecum)\b/i,
    flag: {
      severity: "high",
      title: "Subpoena obligations",
      detail: "Non-compliance is contempt; objections have a short window.",
      mitigation:
        "Serve written objections within the rule period (commonly 14 days) and meet-and-confer on scope before the return date.",
    },
  },
  {
    pattern: /\b(contempt|sanction|show cause)\b/i,
    flag: {
      severity: "critical",
      title: "Contempt / sanctions exposure",
      detail: "Risk of fines, fees, or jail for non-compliance.",
      mitigation:
        "Document substantial compliance, file a declaration explaining any inability to comply, and appear with counsel.",
    },
  },
  {
    pattern: /\b(class action|putative class|class certification)\b/i,
    flag: {
      severity: "medium",
      title: "Class action posture",
      detail: "Opt-out windows and notice deadlines are easy to miss.",
      mitigation:
        "Track the claims-administration deadline and decide opt-in/opt-out before the cutoff.",
    },
  },
  {
    pattern: /\b(appeal|notice of appeal)\b/i,
    flag: {
      severity: "high",
      title: "Appeal window running",
      detail: "Most appeal deadlines are jurisdictional and cannot be extended.",
      mitigation:
        "Docket the deadline today; file the notice of appeal even if the brief comes later.",
    },
  },
  {
    pattern: /\b(default|default judgment)\b/i,
    flag: {
      severity: "critical",
      title: "Default risk",
      detail: "Failure to answer leads to default judgment within days.",
      mitigation:
        "File an answer or motion to set aside default before the response deadline; gather meritorious-defense evidence.",
    },
  },
  {
    pattern: /\b(garnishment|levy|lien)\b/i,
    flag: {
      severity: "high",
      title: "Collection action",
      detail: "Wages, bank accounts, or property may be seized.",
      mitigation:
        "Claim exemptions in writing within the statutory window and request a hearing if assets are essential.",
    },
  },
  {
    pattern: /\b(hearing|trial)\b.*\b(set|scheduled|on)\b/i,
    flag: {
      severity: "medium",
      title: "Hearing / trial scheduled",
      detail: "Court appearance required; non-appearance may be treated as default.",
      mitigation: "Confirm appearance, prepare exhibits, and coordinate witnesses early.",
    },
  },
  {
    pattern: /\b(discovery|interrogator(?:y|ies)|request for production|admissions)\b/i,
    flag: {
      severity: "medium",
      title: "Discovery obligations",
      detail: "Responses typically due in 30 days; requests for admission are deemed admitted if missed.",
      mitigation: "Calendar a draft-response deadline 10 days before the due date.",
    },
  },
  {
    pattern: /\b(seal|confidential|protective order)\b/i,
    flag: {
      severity: "low",
      title: "Confidentiality terms",
      detail: "Disclosure outside the case may breach a protective order.",
      mitigation: "Limit sharing to counsel-of-record and label exhibits per the order.",
    },
  },
];

const DEADLINE_RE =
  /\b(?:within|no later than|on or before|by)\s+(\d{1,3})\s+(day|days|business days)\b/gi;
const DATE_RE =
  /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/g;

function severityWeight(s: Severity): number {
  return { critical: 35, high: 20, medium: 10, low: 5, info: 0 }[s];
}

function analyze(text: string, docType: DocType): { score: number; flags: RiskFlag[] } {
  const flags: RiskFlag[] = [];
  const seen = new Set<string>();
  for (const r of RULES) {
    if (r.pattern.test(text) && !seen.has(r.flag.title)) {
      seen.add(r.flag.title);
      flags.push({
        severity: r.flag.severity,
        title: r.flag.title,
        detail: r.flag.detail ?? "",
        mitigation: r.flag.mitigation,
      });
    }
  }

  // doc-type baseline
  const baseline: Partial<Record<DocType, RiskFlag>> = {
    "Temporary Restraining Order": {
      severity: "critical",
      title: "TRO baseline risk",
      detail: "TROs are short-lived and convert quickly to preliminary injunctions.",
      mitigation: "Prepare opposition brief and evidence for the conversion hearing now.",
    },
    "Eviction / Writ of Possession": {
      severity: "critical",
      title: "Eviction baseline risk",
      detail: "Sheriff enforcement may be days away.",
      mitigation: "File any stay/appeal, and arrange housing contingencies in parallel.",
    },
    Judgment: {
      severity: "high",
      title: "Judgment baseline risk",
      detail: "Post-judgment collection tools (garnishment, liens) become available.",
      mitigation: "Decide on appeal vs. settlement within the appeal window.",
    },
    Subpoena: {
      severity: "high",
      title: "Subpoena baseline risk",
      detail: "Compliance or objection deadlines are short.",
      mitigation: "Serve written objections immediately if scope is overbroad.",
    },
  };
  const base = baseline[docType];
  if (base && !seen.has(base.title)) flags.push(base);

  // deadline detection
  const deadlineMatches = [...text.matchAll(DEADLINE_RE)];
  if (deadlineMatches.length) {
    const shortest = Math.min(...deadlineMatches.map((m) => Number(m[1])));
    flags.push({
      severity: shortest <= 10 ? "critical" : shortest <= 21 ? "high" : "medium",
      title: `Action required within ${shortest} ${deadlineMatches[0][2]}`,
      detail: "Document text contains an explicit response window.",
      mitigation:
        "Add the deadline to your calendar with a 72-hour pre-alert and assign an owner.",
    });
  }
  const dateMatches = text.match(DATE_RE);
  if (dateMatches && dateMatches.length) {
    flags.push({
      severity: "info",
      title: `Calendared dates: ${dateMatches.slice(0, 3).join("; ")}${dateMatches.length > 3 ? "…" : ""}`,
      detail: "Dates found in the document — verify each on your calendar.",
      mitigation: "Add each to the case calendar with reminders.",
    });
  }

  const score = Math.min(100, flags.reduce((s, f) => s + severityWeight(f.severity), 0));
  return { score, flags };
}

async function readFileText(file: File): Promise<string> {
  if (file.type.startsWith("text/") || /\.(txt|md|csv|json|html?)$/i.test(file.name)) {
    return await file.text();
  }
  // best-effort: try as text for unknown types; PDFs/DOCX won't be readable without a parser
  try {
    const t = await file.text();
    // strip binary noise heuristically
    return t.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, " ").slice(0, 200_000);
  } catch {
    return "";
  }
}

// ---------- UI ----------
function sevStyle(s: Severity) {
  return {
    critical: "border-destructive/40 bg-destructive/10 text-destructive",
    high: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    medium: "border-primary/30 bg-primary/10 text-primary",
    low: "border-border bg-muted text-muted-foreground",
    info: "border-border bg-background text-muted-foreground",
  }[s];
}

function CourtDocsPage() {
  const [docs, setDocs] = useState<CourtDoc[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<"upload" | "library">("upload");

  useEffect(() => {
    setDocs(loadDocs());
  }, []);

  const selected = useMemo(
    () => (selectedId ? docs.find((d) => d.id === selectedId) ?? null : null),
    [docs, selectedId],
  );

  function persist(next: CourtDoc[]) {
    setDocs(next);
    saveDocs(next);
  }

  function onDelete(id: string) {
    const next = docs.filter((d) => d.id !== id);
    persist(next);
    if (selectedId === id) setSelectedId(null);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-primary">
              Syncora Connect
            </Link>
            <span>/</span>
            <span className="text-foreground">Court documents</span>
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Court document vault & risk mitigation
          </h1>
          <p className="mt-3 max-w-3xl text-base text-muted-foreground">
            Upload orders, motions, and filings from court. The system flags compliance
            obligations, response deadlines, appeal windows, and contempt exposure — with
            a mitigation step for each risk.
          </p>
          <div className="mt-6 inline-flex rounded-full border border-border bg-background p-1">
            {(["upload", "library"] as const).map((t) => (
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
                {t === "upload" ? "Upload document" : `Library (${docs.length})`}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        {tab === "upload" ? (
          <UploadForm
            onUploaded={(d) => {
              const next = [d, ...docs];
              persist(next);
              setSelectedId(d.id);
              setTab("library");
            }}
          />
        ) : (
          <Library
            docs={docs}
            onOpen={(id) => setSelectedId(id)}
            onDelete={onDelete}
          />
        )}
      </main>

      {selected && <DocDrawer doc={selected} onClose={() => setSelectedId(null)} />}
    </div>
  );
}

function UploadForm({ onUploaded }: { onUploaded: (d: CourtDoc) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<DocType>("Order");
  const [caseCaption, setCaseCaption] = useState("");
  const [court, setCourt] = useState("");
  const [docket, setDocket] = useState("");
  const [dateFiled, setDateFiled] = useState(new Date().toISOString().slice(0, 10));
  const [deadline, setDeadline] = useState("");
  const [notes, setNotes] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file && !pastedText.trim()) {
      return setError("Attach a file or paste the order text so we can analyze it.");
    }
    if (!caseCaption.trim()) return setError("Add the case caption.");
    setBusy(true);
    try {
      const text = file
        ? (await readFileText(file)) + "\n" + pastedText
        : pastedText;
      const { score, flags } = analyze(text, docType);
      const d: CourtDoc = {
        id: crypto.randomUUID(),
        filename: file?.name ?? "Pasted text",
        size: file?.size ?? new Blob([pastedText]).size,
        mime: file?.type ?? "text/plain",
        doc_type: docType,
        case_caption: caseCaption.trim(),
        court: court.trim(),
        docket: docket.trim(),
        date_filed: dateFiled,
        deadline: deadline || undefined,
        notes: notes.trim(),
        text_excerpt: text.slice(0, 4000),
        uploaded_at: Date.now(),
        risk_score: score,
        flags,
      };
      onUploaded(d);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="mx-auto max-w-3xl space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8"
    >
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Document file
        </label>
        <input
          type="file"
          accept=".pdf,.doc,.docx,.txt,.rtf,.md,image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          PDFs and DOCX aren't parsed in-browser — for best risk analysis, also paste the
          key order language below.
        </p>
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Order / decree text (optional but recommended)
        </label>
        <textarea
          rows={5}
          value={pastedText}
          onChange={(e) => setPastedText(e.target.value)}
          placeholder="Paste the operative paragraphs of the order…"
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Document type
          </label>
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value as DocType)}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            {DOC_TYPES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Case caption
          </label>
          <input
            value={caseCaption}
            onChange={(e) => setCaseCaption(e.target.value)}
            placeholder="Smith v. Jones"
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Court
          </label>
          <input
            value={court}
            onChange={(e) => setCourt(e.target.value)}
            placeholder="Travis County District Court"
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Docket / case #
          </label>
          <input
            value={docket}
            onChange={(e) => setDocket(e.target.value)}
            placeholder="2025-CI-001234"
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Date filed
          </label>
          <input
            type="date"
            value={dateFiled}
            onChange={(e) => setDateFiled(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Response deadline (if known)
          </label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Notes
        </label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center justify-end gap-3">
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Analyzing…" : "Upload & analyze risk"}
        </button>
      </div>

      <p className="text-xs text-muted-foreground">
        Documents stay in your browser. This is a triage tool, not legal advice — confirm
        every deadline with your attorney.
      </p>
    </form>
  );
}

function riskBand(score: number): { label: string; cls: string } {
  if (score >= 60)
    return { label: "Critical risk", cls: "border-destructive/40 bg-destructive/10 text-destructive" };
  if (score >= 35)
    return { label: "Elevated risk", cls: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300" };
  if (score >= 15)
    return { label: "Moderate risk", cls: "border-primary/30 bg-primary/10 text-primary" };
  return { label: "Low risk", cls: "border-border bg-muted text-muted-foreground" };
}

function Library({
  docs,
  onOpen,
  onDelete,
}: {
  docs: CourtDoc[];
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (!docs.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <p className="text-sm text-muted-foreground">
          No court documents uploaded yet. Use the Upload tab to add your first order.
        </p>
      </div>
    );
  }
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {docs.map((d) => {
        const band = riskBand(d.risk_score);
        return (
          <div
            key={d.id}
            className="rounded-2xl border border-border bg-card p-5 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <span className={"rounded-full border px-2 py-0.5 text-xs font-medium " + band.cls}>
                {band.label} · {d.risk_score}
              </span>
              <span className="text-xs text-muted-foreground">{d.doc_type}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {new Date(d.uploaded_at).toLocaleDateString()}
              </span>
            </div>
            <h3 className="mt-3 text-base font-semibold text-card-foreground">
              {d.case_caption}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {d.court || "—"} · {d.docket || "no docket"} · filed {d.date_filed}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {d.filename} ({Math.round(d.size / 1024)} KB) · {d.flags.length} flag
              {d.flags.length === 1 ? "" : "s"}
            </p>
            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpen(d.id)}
                className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:opacity-90"
              >
                Open risk report
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm("Delete this document?")) onDelete(d.id);
                }}
                className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground hover:text-destructive"
              >
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DocDrawer({ doc, onClose }: { doc: CourtDoc; onClose: () => void }) {
  const band = riskBand(doc.risk_score);
  const sorted = [...doc.flags].sort(
    (a, b) => severityWeight(b.severity) - severityWeight(a.severity),
  );
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-foreground/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <aside
        className="h-full w-full max-w-2xl overflow-y-auto bg-background p-6 shadow-2xl md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <span
              className={"rounded-full border px-2 py-0.5 text-xs font-medium " + band.cls}
            >
              {band.label} · score {doc.risk_score}/100
            </span>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">
              {doc.case_caption}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {doc.doc_type} · {doc.court || "—"} · {doc.docket || "no docket"} · filed{" "}
              {doc.date_filed}
              {doc.deadline ? ` · response due ${doc.deadline}` : ""}
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

        <section className="mt-6">
          <h3 className="text-sm font-semibold text-foreground">
            Risk mitigation ({sorted.length})
          </h3>
          {sorted.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              No risk patterns detected. Still confirm all deadlines manually.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {sorted.map((f, i) => (
                <li
                  key={i}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        "rounded-full border px-2 py-0.5 text-xs font-medium capitalize " +
                        sevStyle(f.severity)
                      }
                    >
                      {f.severity}
                    </span>
                    <h4 className="text-sm font-semibold text-card-foreground">
                      {f.title}
                    </h4>
                  </div>
                  {f.detail && (
                    <p className="mt-1 text-sm text-muted-foreground">{f.detail}</p>
                  )}
                  <p className="mt-2 text-sm text-foreground">
                    <span className="font-medium">Mitigation: </span>
                    {f.mitigation}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {doc.notes && (
          <section className="mt-6 rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-card-foreground">Your notes</h3>
            <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
              {doc.notes}
            </p>
          </section>
        )}

        {doc.text_excerpt && (
          <section className="mt-6">
            <h3 className="text-sm font-semibold text-foreground">Excerpt analyzed</h3>
            <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-muted/40 p-4 text-xs text-muted-foreground">
              {doc.text_excerpt}
            </pre>
          </section>
        )}
      </aside>
    </div>
  );
}