/** "HH:MM", 24 h. */
export type Time = string;
/** "YYYY-MM-DD", in the clinic's local calendar. */
export type DateKey = string;

export type Service = {
  id: string;
  name: string;
  description: string;
  minutes: number;
  /** Example price in ARS. */
  priceFrom: number;
};

export type Professional = {
  id: string;
  name: string;
  role: string;
  /** Services this professional performs. */
  serviceIds: string[];
  /** Weekday (0 = Sunday … 6 = Saturday) → working windows. Missing day = day off. */
  schedule: Partial<Record<number, [Time, Time][]>>;
};

export type ClinicConfig = {
  slug: string;
  name: string;
  /** "Clínica dental", "Barbería"… */
  kind: string;
  tagline: string;
  description: string;
  address: string;
  city: string;
  /** Digits only, with country code, e.g. 5491112345678. */
  whatsapp: string;
  phone: string;
  /** Opening hours shown on the home page. */
  hours: { label: string; value: string }[];
  theme: { brand: string; brandInk: string; soft: string; ink?: string };
  /** Minutes between possible start times. */
  slotStepMinutes: number;
  /** How many days ahead a patient can book. */
  bookingWindowDays: number;
  /** Minimum notice in minutes for web bookings. */
  leadMinutes: number;
  /** Hours before the visit until the patient can still cancel online. */
  cancelUntilHours: number;
  /** Insurance / payment options. Leave empty to hide the selector. */
  coverages: string[];
  /** Word for the person being attended: "paciente", "cliente". */
  clientWord: string;
  services: Service[];
  professionals: Professional[];
  /** Frequently asked questions shown on the home page. Leave out to hide the section. */
  faq?: { question: string; answer: string }[];
  /** Photos for the home page. Leave out to show the page without images. */
  photos?: { hero?: Photo; gallery?: Photo[] };
};

export type Photo = {
  /** Path under /public. */
  src: string;
  width: number;
  height: number;
  alt: string;
  credit: { title: string; author: string; license: string; source: string };
};

export type AppointmentStatus = "confirmado" | "completado" | "ausente" | "cancelado";

export type Appointment = {
  id: string;
  serviceId: string;
  professionalId: string;
  date: DateKey;
  time: Time;
  minutes: number;
  patient: { name: string; phone: string; email: string; coverage: string };
  notes: string;
  status: AppointmentStatus;
  source: "web" | "manual";
  createdAt: string;
};
