import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  addClaim,
  addDocument,
  addElement,
  claimReadiness,
  DOCUMENT_KIND_LABEL,
  PROOF_STRENGTH_LABEL,
  removeClaim,
  removeDocument,
  removeElement,
  toggleElementDoc,
  updateCaseMeta,
  updateElement,
  useMatrix,
  type CourtDocument,
  type DocumentKind,
  type MatrixClaim,
  type MatrixElement,
  type ProofStrength,
} from "@/lib/litigation-matrix";

export const Route = createFileRoute("/playbooks/matrix")({
  head: () => ({
    meta: [
      { title: "Litigation Matrix — Syncora Connect" },
      {
        name: "description",
        content:
          "Systems-engineering approach to litigation: map each claim's elements to evidence, attach court documents, and see proof readiness at a glance.",
      },
      {
        property: "og:title",
        content: "Litigation Matrix — Systems Engineering for Cases",
      },
      {
        property: "og:description",
        content:
          "Break every claim into elements, link supporting court documents, and surface the gaps before trial.",
      },
    ],
  }),
  component: MatrixPage,
});

const STRENGTHS: ProofStrength[] = ["missing", "weak", "adequate", "strong"];

function strengthClass(s: ProofStrength) {
  return {
    missing: "bg-destructive/10 text-destructive border-destructive/30",
    weak: "bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400",
    adequate: "bg-primary/10 text-primary border-primary/30",
    strong: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400",
  }[s];
}

function MatrixPage() {
  const m = useMatrix();
  const [docPanelOpen, setDocPanelOpen] = useState(false);

  const overallPct = useMemo(() => {
    if (m.claims.length === 0) return 0;
    const s = m.claims.reduce((acc, c) => acc + claimReadiness(c).pct, 0);
    return Math.round(s / m.claims.length);
  }, [m.claims]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-primary">Syncora Connect</Link>
            <span>/</span>
            <span>Playbooks</span>
            <span>/</span>
            <span className="text-foreground">Litigation Matrix</span>
          </div>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                Litigation matrix
              </h1>
              <p className="mt-2 max-w-3xl text-base text-muted-foreground">
                A systems-engineering view of the case. Every claim breaks into legal
                elements. Every element is backed by evidence and court documents.
                Empty cells are the gaps to close before trial.
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Overall readiness
              </div>
              <div className="text-3xl font-semibold text-foreground">{overallPct}%</div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <MetaInput label="Case name" value={m.case_name} onChange={(v) => updateCaseMeta({ case_name: v })} />
            <MetaInput label="Case number" value={m.case_number} onChange={(v) => updateCaseMeta({ case_number: v })} />
            <MetaInput label="Forum" value={m.forum} onChange={(v) => updateCaseMeta({ forum: v })} />
            <MetaInput label="Trial date" value={m.trial_date} onChange={(v) => updateCaseMeta({ trial_date: v })} type="date" />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setDocPanelOpen(true)}
              className="rounded-full border border-border bg-background px-4 py-1.5 text-sm font-medium text-foreground hover:border-primary/40 hover:text-primary"
            >
              Court documents ({m.documents.length})
            </button>
            <Link
              to="/playbooks/litigation"
              className="rounded-full border border-border bg-background px-4 py-1.5 text-sm font-medium text-foreground hover:border-primary/40 hover:text-primary"
            >
              ← Phase playbook
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="space-y-6">
          {m.claims.map((claim) => (
            <ClaimCard key={claim.id} claim={claim} docs={m.documents} />
          ))}
          <AddClaimForm />
        </div>
      </main>

      {docPanelOpen && (
        <DocumentPanel docs={m.documents} onClose={() => setDocPanelOpen(false)} />
      )}
    </div>
  );
}

function MetaInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
      />
    </label>
  );
}

function ClaimCard({ claim, docs }: { claim: MatrixClaim; docs: CourtDocument[] }) {
  const readiness = claimReadiness(claim);
  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-card-foreground">{claim.name}</h2>
          <p className="text-sm text-muted-foreground">
            {claim.cause_of_action} · {claim.party}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-muted-foreground">{readiness.label}</div>
            <div className="text-lg font-semibold text-foreground">{readiness.pct}%</div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (confirm(`Remove claim "${claim.name}"?`)) removeClaim(claim.id);
            }}
            className="text-xs text-muted-foreground hover:text-destructive"
          >
            Remove
          </button>
        </div>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-primary transition-all" style={{ width: `${readiness.pct}%` }} />
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[800px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="py-2 pr-3 font-semibold">Element to prove</th>
              <th className="py-2 pr-3 font-semibold">Burden</th>
              <th className="py-2 pr-3 font-semibold">Strength</th>
              <th className="py-2 pr-3 font-semibold">Evidence notes</th>
              <th className="py-2 pr-3 font-semibold">Documents</th>
              <th className="py-2 font-semibold" />
            </tr>
          </thead>
          <tbody>
            {claim.elements.map((el) => (
              <ElementRow key={el.id} claimId={claim.id} el={el} docs={docs} />
            ))}
            {claim.elements.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-sm text-muted-foreground">
                  No elements yet — add the first one below.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AddElementForm claimId={claim.id} />
    </section>
  );
}

function ElementRow({
  claimId,
  el,
  docs,
}: {
  claimId: string;
  el: MatrixElement;
  docs: CourtDocument[];
}) {
  const [docPickerOpen, setDocPickerOpen] = useState(false);
  const linked = docs.filter((d) => el.document_ids.includes(d.id));
  return (
    <tr className="border-b border-border align-top">
      <td className="py-3 pr-3">
        <textarea
          value={el.text}
          onChange={(e) => updateElement(claimId, el.id, { text: e.target.value })}
          rows={2}
          className="w-56 rounded-md border border-border bg-background px-2 py-1 text-sm"
        />
      </td>
      <td className="py-3 pr-3">
        <select
          value={el.burden}
          onChange={(e) =>
            updateElement(claimId, el.id, { burden: e.target.value as MatrixElement["burden"] })
          }
          className="rounded-md border border-border bg-background px-2 py-1 text-xs"
        >
          <option value="prima facie">prima facie</option>
          <option value="rebuttal">rebuttal</option>
          <option value="damages">damages</option>
        </select>
      </td>
      <td className="py-3 pr-3">
        <select
          value={el.strength}
          onChange={(e) =>
            updateElement(claimId, el.id, { strength: e.target.value as ProofStrength })
          }
          className={
            "rounded-md border px-2 py-1 text-xs font-medium " + strengthClass(el.strength)
          }
        >
          {STRENGTHS.map((s) => (
            <option key={s} value={s}>
              {PROOF_STRENGTH_LABEL[s]}
            </option>
          ))}
        </select>
      </td>
      <td className="py-3 pr-3">
        <textarea
          value={el.evidence_notes}
          onChange={(e) => updateElement(claimId, el.id, { evidence_notes: e.target.value })}
          rows={2}
          placeholder="What proves this? Witness, document, admission…"
          className="w-64 rounded-md border border-border bg-background px-2 py-1 text-sm"
        />
      </td>
      <td className="py-3 pr-3">
        <div className="flex flex-wrap gap-1">
          {linked.map((d) => (
            <span
              key={d.id}
              className="rounded-full border border-border bg-background px-2 py-0.5 text-xs"
              title={d.title}
            >
              {d.cite}
            </span>
          ))}
          <button
            type="button"
            onClick={() => setDocPickerOpen((o) => !o)}
            className="rounded-full border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground hover:border-primary hover:text-primary"
          >
            + link
          </button>
        </div>
        {docPickerOpen && (
          <div className="mt-2 max-h-44 w-64 overflow-y-auto rounded-md border border-border bg-background p-2 text-xs shadow-md">
            {docs.length === 0 && (
              <p className="text-muted-foreground">No documents yet. Add some in the Documents panel.</p>
            )}
            {docs.map((d) => {
              const has = el.document_ids.includes(d.id);
              return (
                <label
                  key={d.id}
                  className="flex cursor-pointer items-start gap-2 rounded p-1 hover:bg-muted"
                >
                  <input
                    type="checkbox"
                    checked={has}
                    onChange={() => toggleElementDoc(claimId, el.id, d.id)}
                    className="mt-0.5 accent-primary"
                  />
                  <span>
                    <span className="font-medium text-foreground">{d.cite}</span>{" "}
                    <span className="text-muted-foreground">— {d.title}</span>
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </td>
      <td className="py-3">
        <button
          type="button"
          onClick={() => removeElement(claimId, el.id)}
          className="text-xs text-muted-foreground hover:text-destructive"
        >
          ✕
        </button>
      </td>
    </tr>
  );
}

function AddElementForm({ claimId }: { claimId: string }) {
  const [text, setText] = useState("");
  const [burden, setBurden] = useState<MatrixElement["burden"]>("prima facie");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim()) return;
        addElement(claimId, text.trim(), burden);
        setText("");
        setBurden("prima facie");
      }}
      className="mt-4 flex flex-wrap gap-2"
    >
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="New element to prove…"
        className="min-w-[16rem] flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm"
      />
      <select
        value={burden}
        onChange={(e) => setBurden(e.target.value as MatrixElement["burden"])}
        className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
      >
        <option value="prima facie">prima facie</option>
        <option value="rebuttal">rebuttal</option>
        <option value="damages">damages</option>
      </select>
      <button
        type="submit"
        className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        Add element
      </button>
    </form>
  );
}

function AddClaimForm() {
  const [name, setName] = useState("");
  const [cause, setCause] = useState("");
  const [party, setParty] = useState<MatrixClaim["party"]>("plaintiff");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        addClaim(name.trim(), cause.trim(), party);
        setName("");
        setCause("");
      }}
      className="rounded-2xl border border-dashed border-border bg-card p-5"
    >
      <h3 className="text-sm font-semibold text-card-foreground">Add a claim or defense</h3>
      <div className="mt-3 grid gap-2 md:grid-cols-[2fr,2fr,1fr,auto]">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Count / defense name"
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
        />
        <input
          value={cause}
          onChange={(e) => setCause(e.target.value)}
          placeholder="Cause of action / statute"
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
        />
        <select
          value={party}
          onChange={(e) => setParty(e.target.value as MatrixClaim["party"])}
          className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
        >
          <option value="plaintiff">plaintiff</option>
          <option value="defendant">defendant</option>
          <option value="counterclaim">counterclaim</option>
        </select>
        <button
          type="submit"
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Add
        </button>
      </div>
    </form>
  );
}

const DOC_KINDS = Object.keys(DOCUMENT_KIND_LABEL) as DocumentKind[];

function DocumentPanel({ docs, onClose }: { docs: CourtDocument[]; onClose: () => void }) {
  const [kind, setKind] = useState<DocumentKind>("exhibit");
  const [title, setTitle] = useState("");
  const [cite, setCite] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !cite.trim()) return;
    addDocument({
      kind,
      title: title.trim(),
      cite: cite.trim(),
      url: url.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    setTitle("");
    setCite("");
    setUrl("");
    setNotes("");
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
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Court documents</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border bg-background px-3 py-1 text-sm text-muted-foreground hover:text-foreground"
          >
            Close
          </button>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Build a shared library of filings, exhibits, depositions, and orders. Each one
          can be linked to the elements it supports.
        </p>

        <form onSubmit={submit} className="mt-5 space-y-3 rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-card-foreground">Add a document</h3>
          <div className="grid gap-2 md:grid-cols-2">
            <label className="text-xs text-muted-foreground">
              Kind
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as DocumentKind)}
                className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
              >
                {DOC_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {DOCUMENT_KIND_LABEL[k]}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-muted-foreground">
              Cite (e.g. Dkt. 42, Ex. B, Depo 88:2)
              <input
                value={cite}
                onChange={(e) => setCite(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
              />
            </label>
          </div>
          <label className="block text-xs text-muted-foreground">
            Title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
            />
          </label>
          <label className="block text-xs text-muted-foreground">
            Link (PACER / Drive / local)
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
            />
          </label>
          <label className="block text-xs text-muted-foreground">
            Notes
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
            />
          </label>
          <button
            type="submit"
            className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Add document
          </button>
        </form>

        <ul className="mt-6 space-y-3">
          {docs.map((d) => (
            <li key={d.id} className="rounded-lg border border-border bg-card p-3 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-medium text-card-foreground">
                    {d.cite} — {d.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {DOCUMENT_KIND_LABEL[d.kind]}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Remove "${d.title}"?`)) removeDocument(d.id);
                  }}
                  className="text-xs text-muted-foreground hover:text-destructive"
                >
                  Remove
                </button>
              </div>
              {d.notes && <p className="mt-1 text-muted-foreground">{d.notes}</p>}
              {d.url && (
                <a
                  href={d.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block text-xs text-primary hover:underline"
                >
                  Open ↗
                </a>
              )}
            </li>
          ))}
          {docs.length === 0 && (
            <li className="text-sm text-muted-foreground">No documents yet.</li>
          )}
        </ul>
      </aside>
    </div>
  );
}