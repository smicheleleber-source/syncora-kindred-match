import { useSyncExternalStore } from "react";

export interface ConnectionParameter {
  key: string;      // canonical key (slug)
  label: string;    // display label
  value: string;    // freeform value
  author: "client" | "supplier";
  cleaned?: boolean; // true if AI has normalized it
}

export interface Connection {
  id: string;
  providerId: string;
  providerName: string;
  category: string;
  clientNote: string;
  clientLocation: string;
  clientBudgetMin: number;
  clientBudgetMax: number;
  status: "requested" | "accepted" | "declined";
  createdAt: number;
  parameters: ConnectionParameter[];
}

let connections: Connection[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function getConnections() {
  return connections;
}

export function addConnection(c: Omit<Connection, "id" | "createdAt" | "status" | "parameters">) {
  const conn: Connection = {
    ...c,
    id: `conn-${Date.now()}`,
    createdAt: Date.now(),
    status: "requested",
    parameters: [],
  };
  connections = [conn, ...connections];
  emit();
  return conn;
}

export function updateConnection(id: string, patch: Partial<Connection>) {
  connections = connections.map((c) => (c.id === id ? { ...c, ...patch } : c));
  emit();
}

export function addParameter(id: string, p: ConnectionParameter) {
  connections = connections.map((c) =>
    c.id === id ? { ...c, parameters: [...c.parameters, p] } : c,
  );
  emit();
}

export function replaceParameters(id: string, params: ConnectionParameter[]) {
  connections = connections.map((c) =>
    c.id === id ? { ...c, parameters: params } : c,
  );
  emit();
}

export function useConnections() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    getConnections,
    getConnections,
  );
}

// ---- Global parameter library (cleaned canonical params) ----

export interface LibraryParameter {
  key: string;
  label: string;
  example: string;
  uses: number;
}

let library: LibraryParameter[] = [];
const libListeners = new Set<() => void>();
const emitLib = () => libListeners.forEach((l) => l());

export function getLibrary() {
  return library;
}

export function promoteToLibrary(params: { key: string; label: string; example: string }[]) {
  const map = new Map(library.map((p) => [p.key, p]));
  for (const p of params) {
    const existing = map.get(p.key);
    if (existing) {
      map.set(p.key, { ...existing, uses: existing.uses + 1, example: p.example || existing.example });
    } else {
      map.set(p.key, { ...p, uses: 1 });
    }
  }
  library = Array.from(map.values()).sort((a, b) => b.uses - a.uses);
  emitLib();
}

export function useLibrary() {
  return useSyncExternalStore(
    (cb) => {
      libListeners.add(cb);
      return () => libListeners.delete(cb);
    },
    getLibrary,
    getLibrary,
  );
}
