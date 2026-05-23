import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  addJudge,
  removeJudge,
  updateJudge,
  useJudges,
} from "@/lib/judges-store";

export const Route = createFileRoute("/admin/judges")({
  head: () => ({
    meta: [
      { title: "Admin · Judges — Syncora Connect" },
      {
        name: "description",
        content:
          "Add, edit, and validate judge practice areas.",
      },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminJudgesPage,
});

function AdminJudgesPage() {
  const { judges } = useJudges();
  const [filter, setFilter] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<{
    name: string;
    court: string;
    jurisdiction: string;
    practiceAreas: string[];
    validated_practice_areas: string[];
  }>({ name: "", court: "", jurisdiction: "", practiceAreas: [], validated_practice_areas: [] });
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return judges;
    return judges.filter(
      (j) =>
        j.name.toLowerCase().includes(q) ||
        j.court.toLowerCase().includes(q) ||
        j.jurisdiction.toLowerCase().includes(q),
    );
  }, [judges, filter]);

  function startCreate() {
    setDraft({ name: "", court: "", jurisdiction: "", practiceAreas: [], validated_practice_areas: [] });
    setCreating(true);
    setEditingId(null);
    setError("");
  }

  function startEdit(j: (typeof judges)[0]) {
    setDraft({
      name: j.name,
      court: j.court,
      jurisdiction: j.jurisdiction,
      practiceAreas: [...j.practiceAreas],
      validated_practice_areas: [...(j.validated_practice_areas ?? [])],
    });
    setEditingId(j.id);
    setCreating(false);
    setError("");
  }

  function cancel() {
    setCreating(false);
    setEditingId(null);
    setError("");
  }

  function validate(): string | null {
    if (!draft.name.trim()) return "Name is required.";
    if (!draft.court.trim()) return "Court is required.";
    if (!draft.jurisdiction.trim()) return "Jurisdiction is required.";
    if (draft.practiceAreas.length === 0) return "Add at least one practice area.";
    return null;
  }

  function save() {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    const cleaned = {
      name: draft.name.trim(),
      court: draft.court.trim(),
      jurisdiction: draft.jurisdiction.trim(),
      practiceAreas: draft.practiceAreas.map((s) => s.trim()).filter(Boolean),
      validated_practice_areas: (draft.validated_practice_areas ?? []).filter((s) =>
        draft.practiceAreas.includes(s),
      ),
    };
    if (creating) {
      addJudge(cleaned);
    } else if (editingId) {
      updateJudge(editingId, cleaned);
    }
    cancel();
  }

  function remove(id: string) {
    if (!confirm("Remove this judge?")) return;
    removeJudge(id);
    if (editingId === id) cancel();
  }

  const [newArea, setNewArea] = useState("");

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-lg font-semibold">
            Syncora Connect
          </Link>
          <span className="text-sm text-muted-foreground">Admin · Judges</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Judge directory</h1>
            <p className="text-sm text-muted-foreground">
              {judges.length} judge{judges.length === 1 ? "" : "s"} in the system.
            </p>
          </div>
          <div className="flex gap-2">
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value.slice(0, 100))}
              placeholder="Filter by name, court, jurisdiction"
              className="w-64 rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <button
              onClick={startCreate}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              + Add judge
            </button>
          </div>
        </div>

        {(creating || editingId) && (
          <section className="mt-6 rounded-2xl border border-primary/40 bg-card p-5">
            <h2 className="text-lg font-semibold">
              {creating ? "New judge" : `Editing: ${draft.name || "(unnamed)"}`}
            </h2>
            {error && (
              <p className="mt-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Name">
                <input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
                />
              </Field>
              <Field label="Court">
                <input
                  value={draft.court}
                  onChange={(e) => setDraft({ ...draft, court: e.target.value })}
                  className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
                />
              </Field>
              <Field label="Jurisdiction">
                <input
                  value={draft.jurisdiction}
                  onChange={(e) => setDraft({ ...draft, jurisdiction: e.target.value })}
                  placeholder="e.g. TX or Federal"
                  className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
                />
              </Field>
              <Field label="Practice areas">
                <div className="flex gap-2">
                  <input
                    value={newArea}
                    onChange={(e) => setNewArea(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newArea.trim()) {
                        e.preventDefault();
                        const area = newArea.trim().toLowerCase();
                        if (!draft.practiceAreas.includes(area)) {
                          setDraft({
                            ...draft,
                            practiceAreas: [...draft.practiceAreas, area],
                          });
                        }
                        setNewArea("");
                      }
                    }}
                    placeholder="Type area + Enter"
                    className="flex-1 rounded border border-border bg-background px-3 py-1.5 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const area = newArea.trim().toLowerCase();
                      if (area && !draft.practiceAreas.includes(area)) {
                        setDraft({
                          ...draft,
                          practiceAreas: [...draft.practiceAreas, area],
                        });
                        setNewArea("");
                      }
                    }}
                    className="rounded border border-border px-3 py-1.5 text-sm"
                  >
                    Add
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {draft.practiceAreas.map((a) => (
                    <span
                      key={a}
                      className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                    >
                      {a}
                      <button
                        type="button"
                        onClick={() =>
                          setDraft({
                            ...draft,
                            practiceAreas: draft.practiceAreas.filter((x) => x !== a),
                            validated_practice_areas: draft.validated_practice_areas.filter(
                              (x) => x !== a,
                            ),
                          })
                        }
                        className="ml-1 text-muted-foreground hover:text-destructive"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </Field>
              <Field
                label={`Validated practice areas (${draft.validated_practice_areas.length}/${draft.practiceAreas.length})`}
                className="md:col-span-2"
              >
                <div className="flex flex-wrap gap-1">
                  {draft.practiceAreas.length === 0 && (
                    <span className="text-xs text-muted-foreground">
                      Add practice areas first — then mark which ones are validated.
                    </span>
                  )}
                  {draft.practiceAreas.map((a) => {
                    const validated = draft.validated_practice_areas.includes(a);
                    return (
                      <button
                        type="button"
                        key={a}
                        onClick={() =>
                          setDraft({
                            ...draft,
                            validated_practice_areas: validated
                              ? draft.validated_practice_areas.filter((x) => x !== a)
                              : [...draft.validated_practice_areas, a],
                          })
                        }
                        className={`rounded-full border px-2 py-0.5 text-xs ${validated ? "border-emerald-600 bg-emerald-600/10 text-emerald-700" : "border-amber-500/60 bg-amber-500/10 text-amber-700"}`}
                      >
                        {validated ? "✓ " : "◷ "}
                        {a}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Claimed (◷) = self-reported or court-assigned docket experience.
                  Validated (✓) = confirmed by Syncora (docket history, bar records,
                  peer attestation).
                </p>
              </Field>
            </div>
            <div className="mt-5 flex gap-2">
              <button
                onClick={save}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                {creating ? "Add judge" : "Save changes"}
              </button>
              <button
                onClick={cancel}
                className="rounded-lg border border-border px-4 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </section>
        )}

        <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Court</th>
                <th className="px-3 py-2 text-left">Jurisdiction</th>
                <th className="px-3 py-2 text-left">Practice Areas</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((j) => (
                <tr key={j.id} className="border-t border-border">
                  <td className="px-3 py-2 font-medium">{j.name}</td>
                  <td className="px-3 py-2">{j.court}</td>
                  <td className="px-3 py-2">{j.jurisdiction}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {j.practiceAreas.map((a) => {
                        const validated = (j.validated_practice_areas ?? []).includes(a);
                        return (
                          <span
                            key={a}
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${validated ? "border-emerald-600/40 bg-emerald-600/10 text-emerald-700" : "border-amber-500/40 bg-amber-500/10 text-amber-700"}`}
                          >
                            {validated ? "✓" : "◷"} {a}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => startEdit(j)}
                      className="rounded px-2 py-1 text-xs text-primary hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => remove(j.id)}
                      className="rounded px-2 py-1 text-xs text-destructive hover:underline"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-6 text-center text-sm text-muted-foreground"
                  >
                    No judges match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <p className="mt-4 text-xs text-muted-foreground">
          Note: changes are held in-memory for this session. Wire to backend
          storage when ready to persist across sessions.
        </p>
      </main>
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="mb-1 block font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}
