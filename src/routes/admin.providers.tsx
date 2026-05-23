import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  addProvider,
  removeProvider,
  updateProvider,
  useProviders,
} from "@/lib/provider-store";
import {
  CATEGORIES,
  SPECIALTIES_BY_CATEGORY,
  type Complexity,
  type Provider,
  type Urgency,
} from "@/lib/providers";

export const Route = createFileRoute("/admin/providers")({
  head: () => ({
    meta: [
      { title: "Admin · Providers — Syncora Connect" },
      {
        name: "description",
        content:
          "Add, edit, and remove providers in the directory: category, complexity, availability, location, and budget range.",
      },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminProvidersPage,
});

const COMPLEXITIES: Complexity[] = ["simple", "moderate", "complex"];
const URGENCIES: Urgency[] = ["high", "medium", "low"];

function emptyDraft(): Provider {
  return {
    id: "",
    name: "",
    category: CATEGORIES[0],
    specialties: [],
    validated_specialties: [],
    complexity_supported: ["moderate"],
    availability: "medium",
    location: "",
    budget_min: 0,
    budget_max: 0,
    bio: "",
  };
}

function AdminProvidersPage() {
  const providers = useProviders();
  const [filter, setFilter] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Provider>(emptyDraft());
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return providers;
    return providers.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q),
    );
  }, [providers, filter]);

  function startCreate() {
    setDraft(emptyDraft());
    setCreating(true);
    setEditingId(null);
    setError("");
  }

  function startEdit(p: Provider) {
    setDraft({ ...p });
    setEditingId(p.id);
    setCreating(false);
    setError("");
  }

  function cancel() {
    setCreating(false);
    setEditingId(null);
    setError("");
  }

  function validate(p: Provider): string | null {
    if (!p.name.trim()) return "Name is required.";
    if (p.name.length > 120) return "Name must be 120 characters or fewer.";
    if (!p.location.trim()) return "Location is required.";
    if (p.location.length > 120) return "Location too long.";
    if (p.bio.length > 1000) return "Bio must be 1000 characters or fewer.";
    if (p.budget_min < 0 || p.budget_max < 0)
      return "Budget values must be non-negative.";
    if (p.budget_max < p.budget_min)
      return "Budget max must be greater than or equal to min.";
    if (p.complexity_supported.length === 0)
      return "Pick at least one complexity level.";
    return null;
  }

  function save() {
    const err = validate(draft);
    if (err) {
      setError(err);
      return;
    }
    const cleaned: Provider = {
      ...draft,
      name: draft.name.trim(),
      location: draft.location.trim(),
      bio: draft.bio.trim(),
      specialties: draft.specialties.map((s) => s.trim()).filter(Boolean),
    };
  // Drop any validated entries that are no longer in specialties.
  cleaned.validated_specialties = (draft.validated_specialties ?? []).filter((s) =>
    cleaned.specialties.includes(s),
  );
    if (creating) {
      addProvider({ ...cleaned, id: crypto.randomUUID() });
    } else if (editingId) {
      updateProvider(editingId, cleaned);
    }
    cancel();
  }

  function remove(id: string) {
    if (!confirm("Remove this provider from the directory?")) return;
    removeProvider(id);
    if (editingId === id) cancel();
  }

  const specialtyOptions = SPECIALTIES_BY_CATEGORY[draft.category] ?? [];

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-lg font-semibold">
            Syncora Connect
          </Link>
          <span className="text-sm text-muted-foreground">Admin · Providers</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Provider directory</h1>
            <p className="text-sm text-muted-foreground">
              {providers.length} provider{providers.length === 1 ? "" : "s"} in
              the matcher.
            </p>
          </div>
          <div className="flex gap-2">
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value.slice(0, 100))}
              placeholder="Filter by name, category, location"
              className="w-64 rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <button
              onClick={startCreate}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              + Add provider
            </button>
          </div>
        </div>

        {(creating || editingId) && (
          <section className="mt-6 rounded-2xl border border-primary/40 bg-card p-5">
            <h2 className="text-lg font-semibold">
              {creating ? "New provider" : `Editing: ${draft.name || "(unnamed)"}`}
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
                  maxLength={120}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
                />
              </Field>
              <Field label="Category">
                <select
                  value={draft.category}
                  onChange={(e) =>
                    setDraft({ ...draft, category: e.target.value, specialties: [] })
                  }
                  className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Location">
                <input
                  value={draft.location}
                  maxLength={120}
                  onChange={(e) =>
                    setDraft({ ...draft, location: e.target.value })
                  }
                  placeholder="City, ST"
                  className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
                />
              </Field>
              <Field label="Availability (soonest urgency)">
                <select
                  value={draft.availability}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      availability: e.target.value as Urgency,
                    })
                  }
                  className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
                >
                  {URGENCIES.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Budget min (USD)">
                <input
                  type="number"
                  min={0}
                  value={draft.budget_min}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      budget_min: Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                  className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
                />
              </Field>
              <Field label="Budget max (USD)">
                <input
                  type="number"
                  min={0}
                  value={draft.budget_max}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      budget_max: Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                  className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
                />
              </Field>
              <Field label="Complexity supported">
                <div className="flex gap-3 text-sm">
                  {COMPLEXITIES.map((c) => (
                    <label key={c} className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={draft.complexity_supported.includes(c)}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...draft.complexity_supported, c]
                            : draft.complexity_supported.filter((x) => x !== c);
                          setDraft({ ...draft, complexity_supported: next });
                        }}
                      />
                      {c}
                    </label>
                  ))}
                </div>
              </Field>
              <Field label={`Specialties (${draft.specialties.length})`}>
                <div className="flex max-h-32 flex-wrap gap-1 overflow-y-auto rounded border border-border bg-background p-2">
                  {specialtyOptions.length === 0 && (
                    <span className="text-xs text-muted-foreground">
                      No specialties defined for this category.
                    </span>
                  )}
                  {specialtyOptions.map((s) => {
                    const on = draft.specialties.includes(s);
                    return (
                      <button
                        type="button"
                        key={s}
                        onClick={() =>
                          setDraft({
                            ...draft,
                            specialties: on
                              ? draft.specialties.filter((x) => x !== s)
                              : [...draft.specialties, s],
                            validated_specialties: on
                              ? (draft.validated_specialties ?? []).filter((x) => x !== s)
                              : draft.validated_specialties,
                          })
                        }
                        className={`rounded-full border px-2 py-0.5 text-xs ${on ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </Field>
              <Field
                label={`Validated specialties (${(draft.validated_specialties ?? []).length}/${draft.specialties.length})`}
              >
                <div className="flex max-h-32 flex-wrap gap-1 overflow-y-auto rounded border border-border bg-background p-2">
                  {draft.specialties.length === 0 && (
                    <span className="text-xs text-muted-foreground">
                      Add specialties first — then mark which ones are validated.
                    </span>
                  )}
                  {draft.specialties.map((s) => {
                    const validated = (draft.validated_specialties ?? []).includes(s);
                    return (
                      <button
                        type="button"
                        key={s}
                        onClick={() => {
                          const cur = draft.validated_specialties ?? [];
                          setDraft({
                            ...draft,
                            validated_specialties: validated
                              ? cur.filter((x) => x !== s)
                              : [...cur, s],
                          });
                        }}
                        className={`rounded-full border px-2 py-0.5 text-xs ${validated ? "border-emerald-600 bg-emerald-600/10 text-emerald-700" : "border-amber-500/60 bg-amber-500/10 text-amber-700"}`}
                      >
                        {validated ? "✓ " : "◷ "}
                        {s}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Claimed (◷) = self-reported experience. Validated (✓) = confirmed by
                  Syncora (license, references, or sample work).
                </p>
              </Field>
              <Field label="Bio" className="md:col-span-2">
                <textarea
                  value={draft.bio}
                  maxLength={1000}
                  rows={3}
                  onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
                  className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
                />
              </Field>
            </div>
            <div className="mt-5 flex gap-2">
              <button
                onClick={save}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                {creating ? "Add provider" : "Save changes"}
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
                <th className="px-3 py-2 text-left">Category</th>
                <th className="px-3 py-2 text-left">Location</th>
                <th className="px-3 py-2 text-left">Avail</th>
                <th className="px-3 py-2 text-left">Complexity</th>
                <th className="px-3 py-2 text-right">Budget</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-3 py-2 font-medium">{p.name}</td>
                  <td className="px-3 py-2">{p.category}</td>
                  <td className="px-3 py-2">{p.location}</td>
                  <td className="px-3 py-2">{p.availability}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {p.complexity_supported.join(", ")}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    ${p.budget_min.toLocaleString()}–$
                    {p.budget_max.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => startEdit(p)}
                      className="rounded px-2 py-1 text-xs text-primary hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => remove(p.id)}
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
                    colSpan={7}
                    className="px-3 py-6 text-center text-sm text-muted-foreground"
                  >
                    No providers match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <p className="mt-4 text-xs text-muted-foreground">
          Note: changes are held in the in-memory directory for this session.
          Wire to backend storage when ready to persist across sessions.
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