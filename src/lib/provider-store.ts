import { useSyncExternalStore } from "react";
import { PROVIDERS, type Provider } from "./providers";

// In-memory provider directory. Suppliers added via the "List your practice"
// form are appended here and immediately visible to the matcher.
let providers: Provider[] = [...PROVIDERS];
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
