import { useSyncExternalStore } from "react";

export type ContactMethod = "text" | "email" | "call" | "platform";

export type Booking = {
  id: string;
  professionalId: string;
  clientId: string;
  clientLabel: string; // private — only visible to the professional
  dateISO: string; // YYYY-MM-DD
  startMin: number; // minutes from 00:00
  endMin: number;
  topic: string; // private — only visible to the professional
};

export type Blackout = {
  id: string;
  professionalId: string;
  dateISO: string;
  label: string; // private reason (e.g. "Vacation", "Personal") — never shown to clients
};

export type WeeklyWindow = {
  // 0 = Sunday … 6 = Saturday
  weekday: number;
  startMin: number;
  endMin: number;
};

export type ProfessionalSchedule = {
  professionalId: string;
  name: string;
  slotMinutes: number; // length of bookable slot
  weekly: WeeklyWindow[];
  defaultContact: ContactMethod;
  contactNote: string; // e.g. "Text me first, call only if urgent"
  perClientContact: Record<string, ContactMethod>; // clientId -> override
};

type State = {
  schedules: Record<string, ProfessionalSchedule>;
  bookings: Booking[];
  blackouts: Blackout[];
};

const KEY = "syncora.calendar.v1";

function seed(): State {
  return {
    schedules: {
      "pro-demo": {
        professionalId: "pro-demo",
        name: "Demo Professional",
        slotMinutes: 30,
        weekly: [
          { weekday: 1, startMin: 9 * 60, endMin: 17 * 60 },
          { weekday: 2, startMin: 9 * 60, endMin: 17 * 60 },
          { weekday: 3, startMin: 9 * 60, endMin: 17 * 60 },
          { weekday: 4, startMin: 9 * 60, endMin: 17 * 60 },
          { weekday: 5, startMin: 9 * 60, endMin: 14 * 60 },
        ],
        defaultContact: "email",
        contactNote:
          "Email is preferred for first contact. I'll reply within 1 business day.",
        perClientContact: {},
      },
    },
    bookings: [],
    blackouts: [],
  };
}

let state: State = load();
const listeners = new Set<() => void>();

function load(): State {
  if (typeof window === "undefined") return seed();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return seed();
    return JSON.parse(raw) as State;
  } catch {
    return seed();
  }
}

function persist() {
  if (typeof window !== "undefined") {
    localStorage.setItem(KEY, JSON.stringify(state));
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useCalendar() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => state,
  );
}

export function updateSchedule(
  id: string,
  patch: Partial<ProfessionalSchedule>,
) {
  const cur = state.schedules[id];
  if (!cur) return;
  state = {
    ...state,
    schedules: { ...state.schedules, [id]: { ...cur, ...patch } },
  };
  persist();
}

export function addBlackout(b: Omit<Blackout, "id">) {
  state = {
    ...state,
    blackouts: [...state.blackouts, { ...b, id: crypto.randomUUID() }],
  };
  persist();
}

export function removeBlackout(id: string) {
  state = { ...state, blackouts: state.blackouts.filter((b) => b.id !== id) };
  persist();
}

export function addBooking(b: Omit<Booking, "id">) {
  state = {
    ...state,
    bookings: [...state.bookings, { ...b, id: crypto.randomUUID() }],
  };
  persist();
}

export function cancelBooking(id: string) {
  state = { ...state, bookings: state.bookings.filter((b) => b.id !== id) };
  persist();
}

/** Generate bookable slots for a given date, hiding any private detail. */
export function slotsForDate(
  sched: ProfessionalSchedule,
  dateISO: string,
  bookings: Booking[],
  blackouts: Blackout[],
) {
  const date = new Date(dateISO + "T00:00:00");
  const weekday = date.getDay();
  const isBlackedOut = blackouts.some(
    (b) => b.professionalId === sched.professionalId && b.dateISO === dateISO,
  );
  if (isBlackedOut) return [];
  const windows = sched.weekly.filter((w) => w.weekday === weekday);
  const taken = new Set(
    bookings
      .filter(
        (b) =>
          b.professionalId === sched.professionalId && b.dateISO === dateISO,
      )
      .map((b) => `${b.startMin}-${b.endMin}`),
  );
  const out: { startMin: number; endMin: number; busy: boolean }[] = [];
  for (const w of windows) {
    for (let s = w.startMin; s + sched.slotMinutes <= w.endMin; s += sched.slotMinutes) {
      const e = s + sched.slotMinutes;
      out.push({ startMin: s, endMin: e, busy: taken.has(`${s}-${e}`) });
    }
  }
  return out;
}

export function fmtTime(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const am = h < 12;
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${m.toString().padStart(2, "0")} ${am ? "AM" : "PM"}`;
}

export function nextNDays(n: number): string[] {
  const out: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

export const CONTACT_LABEL: Record<ContactMethod, string> = {
  text: "Text message",
  email: "Email",
  call: "Phone call",
  platform: "Message via Syncora Connect",
};