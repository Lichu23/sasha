// Two booking demos for businesses that live off appointments: a pilates / yoga / training studio (customers book a
// seat in a class) and a nail and beauty center (customers book a treatment with a professional). Both are fictional
// and independent of the shop template (`SHOP`): see README, "Booking demos". Money is in euros, times are the
// business's local time (the shared calendar works in a fixed offset, see lib/pickup.ts).

export type VenueSlug = "estudio" | "belleza";
export type Staff = { id: string; name: string; role: string };
export type Offer = {
  id: string;
  name: string;
  group: string;
  minutes: number;
  /** Euros. */
  price: number;
  blurb: string;
  /** Who can do it (the instructor of a class, the professionals of a treatment). */
  staff: string[];
  /** Seats of a class. */
  capacity?: number;
};
/** A class that repeats every week: the weekdays (0 = Sunday) and the start, in minutes after midnight. */
export type TimetableRow = { offer: string; weekdays: number[]; at: number };

export type Venue = {
  slug: VenueSlug;
  mode: "classes" | "services";
  refPrefix: string;
  name: string;
  kind: string;
  tagline: string;
  address: string;
  phone: string;
  rating: string;
  hours: { label: string; value: string }[];
  /** Opening and closing, in minutes after midnight, by weekday. Absent = closed. */
  open: Partial<Record<number, [number, number]>>;
  /** Services only: what is paid online to hold the appointment (the rest is paid there). */
  deposit: number;
  theme: Record<"cream" | "paper" | "blush" | "brand" | "brand-ink" | "ink" | "muted" | "line", string>;
  staff: Staff[];
  offers: Offer[];
  timetable: TimetableRow[];
  /** How many days ahead can be booked. */
  windowDays: number;
};

const hm = (h: number, m = 0) => h * 60 + m;
const weekdays = [1, 2, 3, 4, 5];

export const estudio: Venue = {
  slug: "estudio",
  mode: "classes",
  refPrefix: "BRI",
  name: "Brisa Studio",
  kind: "Pilates · Yoga · Entrenamiento",
  tagline: "Clases en grupos reducidos, con plaza asegurada.",
  address: "Calle Colón 24, Valencia",
  phone: "+34 960 123 456",
  rating: "4,9",
  hours: [
    { label: "Lunes a viernes", value: "7:30 a 21:00" },
    { label: "Sábados", value: "10:00 a 13:30" },
    { label: "Domingos", value: "11:00 a 12:00" },
  ],
  open: { 1: [hm(7, 30), hm(21)], 2: [hm(7, 30), hm(21)], 3: [hm(7, 30), hm(21)], 4: [hm(7, 30), hm(21)], 5: [hm(7, 30), hm(21)], 6: [hm(10), hm(13, 30)], 0: [hm(11), hm(12)] },
  deposit: 0,
  theme: { cream: "#f5f2ea", paper: "#ffffff", blush: "#e2eee6", brand: "#3d6b58", "brand-ink": "#2b4d3f", ink: "#1d2a24", muted: "#5d6b63", line: "#dde3d8" },
  staff: [
    { id: "marta", name: "Marta", role: "Pilates" },
    { id: "ines", name: "Inés", role: "Yoga" },
    { id: "dani", name: "Dani", role: "Entrenamiento" },
  ],
  offers: [
    { id: "reformer", name: "Pilates Reformer", group: "Pilates", minutes: 55, price: 16, blurb: "Con máquinas. Grupos de 6, todos los niveles.", staff: ["marta"], capacity: 6 },
    { id: "mat", name: "Pilates Mat", group: "Pilates", minutes: 50, price: 11, blurb: "En suelo: core, postura y movilidad.", staff: ["marta", "ines"], capacity: 12 },
    { id: "vinyasa", name: "Yoga Vinyasa", group: "Yoga", minutes: 60, price: 11, blurb: "Flujo dinámico que une respiración y movimiento.", staff: ["ines"], capacity: 12 },
    { id: "hatha", name: "Hatha Yoga suave", group: "Yoga", minutes: 60, price: 10, blurb: "Ritmo lento, ideal para empezar o soltar tensión.", staff: ["ines"], capacity: 12 },
    { id: "funcional", name: "Entrenamiento funcional", group: "Entrenamiento", minutes: 45, price: 9, blurb: "Fuerza y cardio con tu propio peso. Cada uno a su ritmo.", staff: ["dani"], capacity: 10 },
  ],
  timetable: [
    { offer: "mat", weekdays: [1, 3, 5], at: hm(8) },
    { offer: "funcional", weekdays: [2, 4], at: hm(7, 30) },
    { offer: "reformer", weekdays, at: hm(9) },
    { offer: "hatha", weekdays: [2, 4], at: hm(10, 15) },
    { offer: "mat", weekdays: [2, 4], at: hm(12, 30) },
    { offer: "vinyasa", weekdays: [1, 3], at: hm(18, 30) },
    { offer: "funcional", weekdays: [1, 3, 5], at: hm(19) },
    { offer: "reformer", weekdays: [2, 4], at: hm(19, 30) },
    { offer: "vinyasa", weekdays: [2, 4], at: hm(20) },
    { offer: "reformer", weekdays: [6], at: hm(10) },
    { offer: "vinyasa", weekdays: [6], at: hm(11, 15) },
    { offer: "hatha", weekdays: [0], at: hm(11) },
  ],
  windowDays: 30,
};

export const belleza: Venue = {
  slug: "belleza",
  mode: "services",
  refPrefix: "LUM",
  name: "Lumi Nails & Beauty",
  kind: "Uñas · Pestañas · Estética",
  tagline: "Reserva tu cita en un minuto, sin llamar ni esperar respuesta.",
  address: "Calle Cirilo Amorós 12, Valencia",
  phone: "+34 960 654 321",
  rating: "4,9",
  hours: [
    { label: "Lunes a viernes", value: "10:00 a 20:00" },
    { label: "Sábados", value: "10:00 a 14:00" },
    { label: "Domingos", value: "Cerrado" },
  ],
  open: { 1: [hm(10), hm(20)], 2: [hm(10), hm(20)], 3: [hm(10), hm(20)], 4: [hm(10), hm(20)], 5: [hm(10), hm(20)], 6: [hm(10), hm(14)] },
  deposit: 5,
  theme: { cream: "#fbf4f1", paper: "#ffffff", blush: "#f8e2e9", brand: "#b0436c", "brand-ink": "#8a2f52", ink: "#2d1c22", muted: "#7a5f68", line: "#efdbdf" },
  staff: [
    { id: "carla", name: "Carla", role: "Uñas" },
    { id: "noa", name: "Noa", role: "Uñas y pestañas" },
    { id: "sofia", name: "Sofía", role: "Estética y cejas" },
  ],
  offers: [
    { id: "semi", name: "Manicura semipermanente", group: "Uñas", minutes: 45, price: 22, blurb: "Esmalte de larga duración, con limado y cuidado de cutículas.", staff: ["carla", "noa"] },
    { id: "rusa", name: "Manicura rusa", group: "Uñas", minutes: 60, price: 28, blurb: "Cutículas al detalle y acabado limpio y natural.", staff: ["carla", "noa"] },
    { id: "esculpidas", name: "Uñas esculpidas", group: "Uñas", minutes: 90, price: 45, blurb: "Acrílico o gel, con la forma y el largo que elijas.", staff: ["carla"] },
    { id: "pedicura", name: "Pedicura spa", group: "Uñas", minutes: 60, price: 30, blurb: "Exfoliación, masaje y esmaltado.", staff: ["noa", "carla"] },
    { id: "lifting", name: "Lifting de pestañas", group: "Pestañas y cejas", minutes: 60, price: 38, blurb: "Pestañas curvadas y con volumen, hasta 8 semanas.", staff: ["noa", "sofia"] },
    { id: "extensiones", name: "Extensiones pelo a pelo", group: "Pestañas y cejas", minutes: 120, price: 65, blurb: "Mirada definida, a tu medida.", staff: ["noa"] },
    { id: "cejas", name: "Diseño y laminado de cejas", group: "Pestañas y cejas", minutes: 40, price: 25, blurb: "Forma, color y fijación para cejas llenas.", staff: ["sofia"] },
    { id: "facial", name: "Limpieza facial profunda", group: "Estética", minutes: 60, price: 45, blurb: "Limpieza, extracción e hidratación según tu piel.", staff: ["sofia"] },
    { id: "cera", name: "Depilación con cera (piernas)", group: "Estética", minutes: 30, price: 18, blurb: "Piernas completas, con cera tibia.", staff: ["sofia"] },
  ],
  timetable: [],
  windowDays: 30,
};

export const venues: Record<VenueSlug, Venue> = { estudio, belleza };

export const offerOf = (venue: Venue, id: string) => venue.offers.find((o) => o.id === id);
export const staffOf = (venue: Venue, id: string) => venue.staff.find((s) => s.id === id);

const eurosFormat = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: 0, maximumFractionDigits: 2 });
export const euros = (n: number) => eurosFormat.format(n);
