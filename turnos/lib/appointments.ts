"use client";

import { useSyncExternalStore } from "react";
import { clinic, professionalById, serviceById } from "./clinic";
import { addDays, fromDateKey, toDateKey, toMinutes } from "./dates";
import { getSlots } from "./slots";
import type { Appointment, AppointmentStatus, DateKey, Time } from "./types";

/*
 * Demo store: appointments live in this browser's localStorage and nothing is sent anywhere.
 * A real deployment swaps this module for a database (e.g. Supabase) behind the same functions.
 * The key is versioned so a future schema change can't break old saved data.
 */
const STORAGE_KEY = `turnos:v1:${clinic.slug}`;
const EMPTY: Appointment[] = [];
const STATUSES: AppointmentStatus[] = ["confirmado", "completado", "ausente", "cancelado"];

const listeners = new Set<() => void>();
let cachedRaw: string | null = null;
let cachedList: Appointment[] = EMPTY;
let seeded: { day: DateKey; list: Appointment[] } | null = null;

function isAppointment(value: unknown): value is Appointment {
  if (typeof value !== "object" || value === null) return false;
  const a = value as Record<string, unknown>;
  const p = a.patient as Record<string, unknown> | undefined;
  return (
    typeof a.id === "string" &&
    typeof a.serviceId === "string" &&
    typeof a.professionalId === "string" &&
    typeof a.date === "string" &&
    typeof a.time === "string" &&
    typeof a.minutes === "number" &&
    typeof a.notes === "string" &&
    STATUSES.includes(a.status as AppointmentStatus) &&
    typeof p?.name === "string" &&
    typeof p?.phone === "string" &&
    typeof p?.email === "string" &&
    typeof p?.coverage === "string"
  );
}

function parse(raw: string): Appointment[] {
  try {
    const data: unknown = JSON.parse(raw);
    return Array.isArray(data) ? data.filter(isAppointment) : EMPTY;
  } catch {
    return EMPTY;
  }
}

// A believable first look: a few visits per day for the next days, built from the clinic's own schedule.
const DEMO_PATIENTS = [
  "Lucía Fernández", "Martín Gómez", "Sofía Ramírez", "Joaquín Díaz", "Valentina López",
  "Tomás Herrera", "Camila Torres", "Mateo Acosta", "Julieta Navarro", "Bruno Medina",
];

function buildSeed(today: DateKey): Appointment[] {
  const list: Appointment[] = [];
  const dayStart = fromDateKey(today);
  let n = 0;
  for (let offset = 0; offset < 5; offset++) {
    const date = addDays(today, offset);
    for (const pro of clinic.professionals) {
      for (const pick of [1, 4, 7]) {
        const service = clinic.services.find((s) => pro.serviceIds.includes(s.id));
        if (!service) continue;
        const slot = getSlots({
          clinic, service, professionalId: pro.id, date, appointments: list, now: dayStart, leadMinutes: 0,
        })[pick];
        if (!slot) continue;
        const name = DEMO_PATIENTS[n % DEMO_PATIENTS.length];
        list.push({
          id: `demo-${n}`,
          serviceId: service.id,
          professionalId: pro.id,
          date,
          time: slot.time,
          minutes: service.minutes,
          patient: {
            name,
            phone: `11 5555-01${String(n).padStart(2, "0")}`,
            email: `paciente${n}@example.com`,
            coverage: clinic.coverages[n % Math.max(clinic.coverages.length, 1)] ?? "",
          },
          notes: "",
          status: "confirmado",
          source: n % 4 === 0 ? "manual" : "web",
          createdAt: dayStart.toISOString(),
        });
        n++;
      }
    }
  }
  return list;
}

function read(): Appointment[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage blocked (private mode): fall through to the demo data.
  }
  if (raw === null) {
    const today = toDateKey(new Date());
    if (seeded?.day !== today) seeded = { day: today, list: buildSeed(today) };
    return seeded.list;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedList = parse(raw);
  }
  return cachedList;
}

function write(list: Appointment[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    return false;
  }
  listeners.forEach((l) => l());
  return true;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useAppointments(): Appointment[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function useAppointment(id: string): Appointment | undefined {
  const list = useAppointments();
  return list.find((a) => a.id === id);
}

export type NewAppointment = {
  serviceId: string;
  professionalId: string;
  date: DateKey;
  time: Time;
  patient: Appointment["patient"];
  notes: string;
  /** "manual" is the clinic entering a phone or WhatsApp booking: no notice or email required. */
  source: Appointment["source"];
};

export type CreateResult = { ok: true; appointment: Appointment } | { ok: false; error: string };

const PHONE = /^[0-9+()\s-]{7,20}$/;
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;

/** Re-checks everything on submit: the screen can be stale and storage values are never trusted. */
export function createAppointment(input: NewAppointment): CreateResult {
  const service = serviceById(input.serviceId);
  const pro = professionalById(input.professionalId);
  if (!service || !pro) return { ok: false, error: "Ese servicio o profesional ya no está disponible." };

  const name = input.patient.name.trim();
  const phone = input.patient.phone.trim();
  const email = input.patient.email.trim();
  const coverage = input.patient.coverage.trim();
  const notes = input.notes.trim();
  if (name.length < 2 || name.length > 80) return { ok: false, error: "Escribí tu nombre completo." };
  if (!PHONE.test(phone)) return { ok: false, error: "Revisá el teléfono: solo números, de 7 a 20 dígitos." };
  if (input.source === "web" ? !EMAIL.test(email) : email !== "" && !EMAIL.test(email)) {
    return { ok: false, error: "Revisá el email." };
  }
  if (email.length > 120 || notes.length > 300) return { ok: false, error: "Alguno de los textos es demasiado largo." };
  if (coverage !== "" && !clinic.coverages.includes(coverage)) return { ok: false, error: "Elegí una opción de la lista." };

  const current = read();
  const free = getSlots({
    clinic,
    service,
    professionalId: pro.id,
    date: input.date,
    appointments: current,
    now: new Date(),
    leadMinutes: input.source === "manual" ? 0 : clinic.leadMinutes,
  });
  if (!free.some((s) => s.time === input.time)) {
    return { ok: false, error: "Ese horario se acaba de ocupar. Elegí otro, por favor." };
  }

  const appointment: Appointment = {
    id: crypto.randomUUID().slice(0, 8),
    serviceId: service.id,
    professionalId: pro.id,
    date: input.date,
    time: input.time,
    minutes: service.minutes,
    patient: { name, phone, email, coverage },
    notes,
    status: "confirmado",
    source: input.source,
    createdAt: new Date().toISOString(),
  };
  if (!write([...current, appointment])) {
    return { ok: false, error: "No pudimos guardar el turno en este navegador." };
  }
  return { ok: true, appointment };
}

export function setStatus(id: string, status: AppointmentStatus) {
  if (!STATUSES.includes(status)) return;
  write(read().map((a) => (a.id === id ? { ...a, status } : a)));
}

/** Back to the demo data. */
export function resetDemo() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
  listeners.forEach((l) => l());
}

/** Patients can cancel online until `cancelUntilHours` before the visit. */
export function canCancel(a: Appointment, now: Date): boolean {
  if (a.status !== "confirmado") return false;
  const start = fromDateKey(a.date);
  start.setMinutes(toMinutes(a.time));
  return start.getTime() - now.getTime() >= clinic.cancelUntilHours * 3_600_000;
}
