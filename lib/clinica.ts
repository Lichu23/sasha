// The dental clinic demo: a WhatsApp booking assistant (/clinica) and the clinic's agenda (/clinica/agenda).
// All people, phone numbers and figures are made up. To pitch a real clinic, change `clinic` and the data below.
// The chat's calendar and the agenda read the same turnos (this file's `appointments` plus what was booked in
// the chat, see lib/clinica-store.ts), so a slot taken in one is gone from the other.

export const clinic = {
  name: "Sonrisa Dental",
  address: "Av. Central 1234",
  phone: "(0341) 555-0100",
  // Overrides the shop colors inside /clinica (see app/clinica/layout.tsx).
  theme: {
    brand: "#1f6fd1",
    "brand-ink": "#174f96",
    blush: "#e6f0fc",
    cream: "#f6f9fc",
    ink: "#12243a",
    muted: "#566579",
    line: "#dbe5f0",
  },
} as const;

export const dentists = {
  romero: { name: "Dra. Paula Romero", short: "Dra. Romero" },
  gomez: { name: "Dr. Martín Gómez", short: "Dr. Gómez" },
} as const;

export type DentistId = keyof typeof dentists;

/** Who attends each treatment. */
export const serviceDentist: Record<string, DentistId> = {
  "Limpieza dental": "romero",
  "Consulta y diagnóstico": "gomez",
  Blanqueamiento: "romero",
  "Control de ortodoncia": "romero",
};
export const dentistFor = (service?: string): DentistId => (service && serviceDentist[service]) || "romero";

// ---- Calendar: November 2026 (the 1st is a Sunday). Dates are day numbers of that month. ----

export const MONTH = { name: "noviembre", year: 2026, days: 30, firstWeekday: 0 /* 0 = Sunday */ } as const;
/** The demo's "today" is Tuesday 17: bookings start the next day. */
export const FIRST_BOOKABLE = 18;
/** The clinic is closed this day. A day is full when its appointments below take every slot. */
export const closedDates: readonly number[] = [23];
/** The demo's today: the agenda opens on it. */
export const TODAY = 18;

const WEEKDAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
export const weekdayIndex = (date: number) => (MONTH.firstWeekday + date - 1) % 7;
export const weekday = (date: number) => WEEKDAYS[weekdayIndex(date)];
/** "Jueves 19/11" */
export const shortDay = (date: number) => `${weekday(date)} ${date}/11`;
/** "Jueves 19 de noviembre" */
export const longDay = (date: number) => `${weekday(date)} ${date} de ${MONTH.name}`;
/** The working day before a date: where the reminder goes out. */
export function dayBefore(date: number) {
  let d = date - 1;
  while (weekdayIndex(d) === 0 || weekdayIndex(d) === 6) d -= 1;
  return d;
}

/** Appointment slots every 30 minutes, with a break at midday. */
export const daySlots = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"] as const;

export type Slot = { date: number; time: string; dentist: DentistId };

/** Free times of a dentist on a date, given every turno already booked. */
export function freeSlots(date: number, dentist: DentistId, taken: readonly Slot[]): string[] {
  const wd = weekdayIndex(date);
  if (date < FIRST_BOOKABLE || date > MONTH.days || wd === 0 || wd === 6 || closedDates.includes(date)) return [];
  return daySlots.filter((time) => !taken.some((t) => t.date === date && t.dentist === dentist && t.time === time));
}

/** The first free slot for an urgency today (Wednesday 18), from the afternoon, with the dentist on call. */
export const URGENT = { date: 18, from: "15:00", dentist: "gomez" } as const satisfies { date: number; from: string; dentist: DentistId };
export function urgentSlot(taken: readonly Slot[]): string | undefined {
  return freeSlots(URGENT.date, URGENT.dentist, taken).find((time) => time >= URGENT.from);
}

// ---- The agenda ----

export type Status = "done" | "confirmed" | "reminded" | "scheduled";

export const statusLabel: Record<Status, string> = {
  done: "Atendido",
  confirmed: "Confirmó por WhatsApp",
  reminded: "Recordatorio enviado",
  scheduled: "Recordatorio programado",
};

export type Appointment = {
  id: string;
  date: number;
  time: string;
  patient: string;
  service: string;
  dentist: DentistId;
  status: Status;
  phone: string;
  coverage: string;
  /** Booked through the WhatsApp assistant a moment ago. */
  fresh?: string;
};

/** The clinic's turnos before the demo patient books. */
const own: readonly Appointment[] = [
  { id: "a1", date: 18, time: "09:00", patient: "Martín Acosta", service: "Control de ortodoncia", dentist: "romero", status: "done", phone: "341 555-0142", coverage: "OSDE" },
  { id: "a2", date: 18, time: "10:00", patient: "Camila Ríos", service: "Consulta y diagnóstico", dentist: "gomez", status: "done", phone: "341 555-0187", coverage: "Particular" },
  { id: "a3", date: 18, time: "12:00", patient: "Sergio Paz", service: "Blanqueamiento", dentist: "romero", status: "confirmed", phone: "341 555-0113", coverage: "Particular" },
  { id: "a4", date: 18, time: "15:00", patient: "Julieta Díaz", service: "Limpieza dental", dentist: "gomez", status: "confirmed", phone: "341 555-0170", coverage: "Swiss Medical" },
  { id: "a6", date: 18, time: "17:30", patient: "Nicolás Vera", service: "Consulta y diagnóstico", dentist: "romero", status: "reminded", phone: "341 555-0156", coverage: "Particular" },
  { id: "b1", date: 19, time: "09:30", patient: "Valentina Sosa", service: "Control de ortodoncia", dentist: "romero", status: "reminded", phone: "341 555-0199", coverage: "Swiss Medical" },
  { id: "b3", date: 19, time: "15:00", patient: "Tomás Luna", service: "Consulta y diagnóstico", dentist: "gomez", status: "scheduled", phone: "341 555-0121", coverage: "Particular" },
  { id: "c1", date: 20, time: "10:00", patient: "Agustina Bravo", service: "Blanqueamiento", dentist: "romero", status: "scheduled", phone: "341 555-0134", coverage: "Particular" },
  { id: "c2", date: 20, time: "16:00", patient: "Federico Mora", service: "Limpieza dental", dentist: "gomez", status: "scheduled", phone: "341 555-0165", coverage: "OSDE" },
];

// Other days of the month, so the calendar has something on every working day (and 26 is full for Dra. Romero).
const PEOPLE = ["Lara Gómez", "Bruno Ibáñez", "Mía Castro", "Joaquín Ferrari", "Sofía Medina", "Emilio Rossi", "Renata Cabrera", "Gael Ponce", "Olivia Herrera", "Thiago Navarro", "Alma Suárez", "Lucas Peralta", "Noelia Ortiz", "Ramiro Aguirre"];
const ROMERO_SERVICES = ["Limpieza dental", "Blanqueamiento", "Control de ortodoncia"];
const COVERAGES = ["OSDE", "Particular", "Swiss Medical"];
let seq = 0;
function booked(date: number, dentist: DentistId, times: readonly string[]): Appointment[] {
  return times.map((time) => {
    const i = seq++;
    return {
      id: `g${i}`,
      date,
      time,
      patient: PEOPLE[i % PEOPLE.length],
      service: dentist === "romero" ? ROMERO_SERVICES[i % ROMERO_SERVICES.length] : "Consulta y diagnóstico",
      dentist,
      status: "scheduled" as const,
      phone: `341 555-${String(200 + i).padStart(4, "0")}`,
      coverage: COVERAGES[i % COVERAGES.length],
    };
  });
}
const more: Appointment[] = [
  ...booked(24, "romero", ["09:00", "10:30", "15:30"]),
  ...booked(24, "gomez", ["11:00", "16:00"]),
  ...booked(25, "romero", ["09:30", "12:00", "17:00"]),
  ...booked(25, "gomez", ["10:00"]),
  ...booked(26, "romero", daySlots),
  ...booked(26, "gomez", ["09:00", "15:00", "16:30"]),
  ...booked(27, "romero", ["10:00", "15:00"]),
  ...booked(30, "romero", ["09:00"]),
];

export const appointments: readonly Appointment[] = [...own, ...more];

export const weekStats = {
  appointments: 38,
  confirmedRate: 87,
  afterHours: 14,
  topServices: [
    { label: "Limpieza dental", count: 14 },
    { label: "Consulta y diagnóstico", count: 11 },
    { label: "Control de ortodoncia", count: 8 },
    { label: "Blanqueamiento", count: 5 },
  ],
} as const;
