import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  addBlackout,
  addBooking,
  cancelBooking,
  CONTACT_LABEL,
  fmtTime,
  nextNDays,
  removeBlackout,
  slotsForDate,
  updateSchedule,
  useCalendar,
  type ContactMethod,
} from "@/lib/calendar-store";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Availability Calendar — Syncora Connect" },
      {
        name: "description",
        content:
          "Share when you're free without exposing client details, vacations, or how to reach you.",
      },
    ],
  }),
  component: CalendarPage,
});

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const PRO_ID = "pro-demo";

function CalendarPage() {
  const [view, setView] = useState<"client" | "professional">("client");
  const [clientId] = useState("client-you");

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-lg font-semibold">
            Syncora Connect
          </Link>
          <div className="flex gap-2 text-sm">
            <button
              onClick={() => setView("client")}
              className={`rounded-full px-4 py-1.5 ${view === "client" ? "bg-primary text-primary-foreground" : "border border-border"}`}
            >
              Client view
            </button>
            <button
              onClick={() => setView("professional")}
              className={`rounded-full px-4 py-1.5 ${view === "professional" ? "bg-primary text-primary-foreground" : "border border-border"}`}
            >
              Professional view
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {view === "client" ? (
          <ClientView clientId={clientId} />
        ) : (
          <ProfessionalView />
        )}
      </main>
    </div>
  );
}

function ClientView({ clientId }: { clientId: string }) {
  const { schedules, bookings, blackouts } = useCalendar();
  const sched = schedules[PRO_ID];
  const days = useMemo(() => nextNDays(14), []);
  const [selectedDate, setSelectedDate] = useState(days[0]);
  const [topic, setTopic] = useState("");

  if (!sched) return <p>No professional configured.</p>;

  const slots = slotsForDate(sched, selectedDate, bookings, blackouts);
  const contact = sched.perClientContact[clientId] ?? sched.defaultContact;

  function book(startMin: number, endMin: number) {
    if (!topic.trim()) {
      alert("Add a short topic so the professional knows what to prepare.");
      return;
    }
    addBooking({
      professionalId: PRO_ID,
      clientId,
      clientLabel: "You",
      dateISO: selectedDate,
      startMin,
      endMin,
      topic,
    });
    setTopic("");
  }

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_320px]">
      <section>
        <h1 className="text-2xl font-semibold">Book time with {sched.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          You'll only see open and unavailable slots. Other clients, meeting
          topics, and personal time are never shown.
        </p>

        <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
          {days.map((d) => {
            const date = new Date(d + "T00:00:00");
            const active = d === selectedDate;
            return (
              <button
                key={d}
                onClick={() => setSelectedDate(d)}
                className={`flex min-w-[68px] flex-col items-center rounded-xl border px-3 py-2 text-sm ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}
              >
                <span className="text-xs opacity-70">
                  {WEEKDAYS[date.getDay()]}
                </span>
                <span className="text-lg font-semibold">{date.getDate()}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card p-5">
          <label className="text-sm font-medium">Meeting topic</label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Review NDA draft"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {slots.length === 0 && (
              <p className="col-span-full text-sm text-muted-foreground">
                No availability on this day.
              </p>
            )}
            {slots.map((s) => (
              <button
                key={`${s.startMin}-${s.endMin}`}
                disabled={s.busy}
                onClick={() => book(s.startMin, s.endMin)}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  s.busy
                    ? "cursor-not-allowed border-border bg-muted text-muted-foreground line-through"
                    : "border-primary/30 bg-background hover:border-primary hover:bg-primary/5"
                }`}
              >
                {fmtTime(s.startMin)}
              </button>
            ))}
          </div>
        </div>
      </section>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Preferred contact
          </h2>
          <p className="mt-2 text-lg font-semibold">
            {CONTACT_LABEL[contact]}
          </p>
          {sched.contactNote && (
            <p className="mt-2 text-sm text-muted-foreground">
              {sched.contactNote}
            </p>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Location and phone/email details are intentionally hidden. Use the
            channel above — replies route through Syncora Connect.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">Your bookings</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {bookings
              .filter((b) => b.clientId === clientId)
              .map((b) => (
                <li
                  key={b.id}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                >
                  <span>
                    {b.dateISO} · {fmtTime(b.startMin)}
                  </span>
                  <button
                    onClick={() => cancelBooking(b.id)}
                    className="text-xs text-destructive hover:underline"
                  >
                    Cancel
                  </button>
                </li>
              ))}
            {bookings.filter((b) => b.clientId === clientId).length === 0 && (
              <li className="text-sm text-muted-foreground">No bookings yet.</li>
            )}
          </ul>
        </div>
      </aside>
    </div>
  );
}

function ProfessionalView() {
  const { schedules, bookings, blackouts } = useCalendar();
  const sched = schedules[PRO_ID];
  const [blackoutDate, setBlackoutDate] = useState("");
  const [blackoutLabel, setBlackoutLabel] = useState("Vacation");

  if (!sched) return null;
  const myBlackouts = blackouts.filter((b) => b.professionalId === PRO_ID);
  const myBookings = bookings.filter((b) => b.professionalId === PRO_ID);

  function toggleWeekday(weekday: number) {
    const exists = sched.weekly.find((w) => w.weekday === weekday);
    const next = exists
      ? sched.weekly.filter((w) => w.weekday !== weekday)
      : [...sched.weekly, { weekday, startMin: 9 * 60, endMin: 17 * 60 }];
    updateSchedule(PRO_ID, { weekly: next });
  }

  function updateWindow(weekday: number, key: "startMin" | "endMin", v: number) {
    const next = sched.weekly.map((w) =>
      w.weekday === weekday ? { ...w, [key]: v } : w,
    );
    updateSchedule(PRO_ID, { weekly: next });
  }

  function addBO() {
    if (!blackoutDate) return;
    addBlackout({
      professionalId: PRO_ID,
      dateISO: blackoutDate,
      label: blackoutLabel || "Unavailable",
    });
    setBlackoutDate("");
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">Weekly availability</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Clients see free/busy slots only — never the names or topics of other
          meetings.
        </p>
        <div className="mt-4 space-y-2">
          {WEEKDAYS.map((label, i) => {
            const win = sched.weekly.find((w) => w.weekday === i);
            return (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg border border-border px-3 py-2"
              >
                <label className="flex w-20 items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!win}
                    onChange={() => toggleWeekday(i)}
                  />
                  {label}
                </label>
                {win && (
                  <>
                    <TimeInput
                      value={win.startMin}
                      onChange={(v) => updateWindow(i, "startMin", v)}
                    />
                    <span className="text-muted-foreground">to</span>
                    <TimeInput
                      value={win.endMin}
                      onChange={(v) => updateWindow(i, "endMin", v)}
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4">
          <label className="text-sm">Slot length (minutes)</label>
          <input
            type="number"
            min={15}
            step={15}
            value={sched.slotMinutes}
            onChange={(e) =>
              updateSchedule(PRO_ID, {
                slotMinutes: Math.max(15, Number(e.target.value) || 30),
              })
            }
            className="ml-2 w-24 rounded border border-border bg-background px-2 py-1 text-sm"
          />
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">Contact preferences</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tell clients how to reach you without sharing your number, email, or
          office address.
        </p>
        <div className="mt-4 space-y-2">
          {(["text", "email", "call", "platform"] as ContactMethod[]).map(
            (m) => (
              <label
                key={m}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
              >
                <input
                  type="radio"
                  checked={sched.defaultContact === m}
                  onChange={() => updateSchedule(PRO_ID, { defaultContact: m })}
                />
                {CONTACT_LABEL[m]}
              </label>
            ),
          )}
        </div>
        <label className="mt-4 block text-sm">
          Note shown to clients
          <textarea
            value={sched.contactNote}
            onChange={(e) =>
              updateSchedule(PRO_ID, { contactNote: e.target.value })
            }
            rows={3}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 md:col-span-2">
        <h2 className="text-lg font-semibold">Personal time / blackouts</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Block off vacation or focus days. Clients see only that the day is
          unavailable — your reason stays private.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-2">
          <label className="text-sm">
            Date
            <input
              type="date"
              value={blackoutDate}
              onChange={(e) => setBlackoutDate(e.target.value)}
              className="ml-2 rounded border border-border bg-background px-2 py-1"
            />
          </label>
          <label className="text-sm">
            Private reason
            <input
              value={blackoutLabel}
              onChange={(e) => setBlackoutLabel(e.target.value)}
              className="ml-2 rounded border border-border bg-background px-2 py-1"
            />
          </label>
          <button
            onClick={addBO}
            className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground"
          >
            Block date
          </button>
        </div>
        <ul className="mt-4 space-y-2 text-sm">
          {myBlackouts.map((b) => (
            <li
              key={b.id}
              className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
            >
              <span>
                <strong>{b.dateISO}</strong>{" "}
                <span className="text-muted-foreground">— {b.label} (private)</span>
              </span>
              <button
                onClick={() => removeBlackout(b.id)}
                className="text-xs text-destructive hover:underline"
              >
                Remove
              </button>
            </li>
          ))}
          {myBlackouts.length === 0 && (
            <li className="text-sm text-muted-foreground">No blackouts set.</li>
          )}
        </ul>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 md:col-span-2">
        <h2 className="text-lg font-semibold">
          Your bookings <span className="text-sm text-muted-foreground">(private)</span>
        </h2>
        <ul className="mt-3 space-y-2 text-sm">
          {myBookings.map((b) => (
            <li
              key={b.id}
              className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
            >
              <span>
                <strong>{b.dateISO}</strong> · {fmtTime(b.startMin)}–
                {fmtTime(b.endMin)} · {b.clientLabel} — {b.topic}
              </span>
              <button
                onClick={() => cancelBooking(b.id)}
                className="text-xs text-destructive hover:underline"
              >
                Cancel
              </button>
            </li>
          ))}
          {myBookings.length === 0 && (
            <li className="text-sm text-muted-foreground">No bookings yet.</li>
          )}
        </ul>
      </section>
    </div>
  );
}

function TimeInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const h = Math.floor(value / 60)
    .toString()
    .padStart(2, "0");
  const m = (value % 60).toString().padStart(2, "0");
  return (
    <input
      type="time"
      value={`${h}:${m}`}
      onChange={(e) => {
        const [hh, mm] = e.target.value.split(":").map(Number);
        onChange(hh * 60 + mm);
      }}
      className="rounded border border-border bg-background px-2 py-1 text-sm"
    />
  );
}