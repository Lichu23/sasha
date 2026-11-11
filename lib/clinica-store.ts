import { useSyncExternalStore } from "react";
import { appointments, type Appointment, type DentistId, type Slot, type Status } from "./clinica";

// What the demo patient does in the chat (/clinica) shows up in the agenda (/clinica/agenda) and takes the
// slot out of the calendar: both read this store. It lives in localStorage, so it also syncs between tabs.
// The chat clears it when it opens, so every demo starts from the clinic's own turnos.

export type Booked = {
  id: "turno" | "urgencia";
  date: number;
  time: string;
  patient: string;
  service: string;
  dentist: DentistId;
  coverage: string;
  status: Status;
  fresh: string;
};

export type DemoState = { bookings: readonly Booked[]; handoff: string | null };

const KEY = "clinica-demo";
const EVENT = "clinica-demo";
const EMPTY: DemoState = { bookings: [], handoff: null };

let cache: { raw: string | null; state: DemoState } = { raw: null, state: EMPTY };
let memory: DemoState = EMPTY; // used when localStorage isn't available (private mode)

function read(): DemoState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === cache.raw) return cache.state;
    const parsed = raw ? (JSON.parse(raw) as Partial<DemoState>) : null;
    const state: DemoState = { bookings: Array.isArray(parsed?.bookings) ? parsed.bookings : [], handoff: typeof parsed?.handoff === "string" ? parsed.handoff : null };
    cache = { raw, state };
    return state;
  } catch {
    return memory;
  }
}

function write(next: DemoState) {
  memory = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export const useDemoState = (): DemoState => useSyncExternalStore(subscribe, read, () => EMPTY);

export const getDemoState = read;
export const resetDemo = () => write(EMPTY);
export const addBooking = (booking: Booked) => {
  const state = read();
  write({ ...state, bookings: [...state.bookings.filter((b) => b.id !== booking.id), booking] });
};
export const removeBooking = (id: Booked["id"]) => {
  const state = read();
  write({ ...state, bookings: state.bookings.filter((b) => b.id !== id) });
};
export const setBookingStatus = (id: Booked["id"], status: Status) => {
  const state = read();
  write({ ...state, bookings: state.bookings.map((b) => (b.id === id ? { ...b, status } : b)) });
};
export const setHandoff = (patient: string) => write({ ...read(), handoff: patient });

/** Every turno of the clinic: its own plus what the demo patient booked. */
export function allAppointments(state: DemoState): Appointment[] {
  const booked = state.bookings.map((b): Appointment => ({ ...b, phone: "341 555-1234" }));
  return [...appointments, ...booked].sort((a, b) => a.date - b.date || a.time.localeCompare(b.time));
}

export const takenSlots = (state: DemoState): Slot[] => allAppointments(state);
