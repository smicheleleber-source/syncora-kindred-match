import { useSyncExternalStore } from "react";
import { PROVIDERS, type Provider } from "./providers";

// In-memory provider directory. Suppliers added via the "List your practice"
// form are appended here and immediately visible to the matcher.
// Seed providers are treated as already validated (the directory team curated
// them). Newly self-registered providers start with `validated_specialties: []`
// and must be promoted by admin / the validation pipeline.
let providers: Provider[] = PROVIDERS.map((p) => ({
  ...p,
  validated_specialties: p.validated_specialties ?? [...p.specialties],
}));
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function getProviders(): Provider[] {
  return providers;
}

export function addProvider(p: Provider) {
  providers = [...providers, p];
  emit();
}

export function updateProvider(id: string, patch: Partial<Provider>) {
  providers = providers.map((p) => (p.id === id ? { ...p, ...patch } : p));
  emit();
}

export function removeProvider(id: string) {
  providers = providers.filter((p) => p.id !== id);
  emit();
}

export function useProviders(): Provider[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    getProviders,
    getProviders,
  );
}
