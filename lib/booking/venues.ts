// Two booking demos for businesses that live off appointments: a pilates / yoga / training studio (customers book a
// seat in a class) and a nail and beauty center (customers book a treatment with a professional). Both are fictional
// and independent of the shop template (`SHOP`): see README, "Booking demos". Money is in euros, times are the
// business's local time (the shared calendar works in a fixed offset, see lib/pickup.ts).

export type VenueSlug = "estudio" | "belleza" | "nutricion";
export type PayMethod = "tarjeta" | "bizum" | "mercadopago" | "efectivo" | "transferencia";
export type Modality = "presencial" | "online";
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
  /** Where it can be done; absent = only at the place. More than one adds a "how" step to the booking. */
  modes?: Modality[];
};
/** A class that repeats every week: the weekdays (0 = Sunday) and the start, in minutes after midnight. */
export type TimetableRow = { offer: string; weekdays: number[]; at: number };

export type Photo = { src: string; alt: string };
export type Review = { name: string; text: string };

/** The extra sections of a home page without photos (a consulting practice): how it works, who, tips, questions. */
export type HomeSections = {
  steps: { title: string; text: string }[];
  about: { name: string; role: string; bio: string; credentials: string[] };
  tips: { tag: string; title: string; text: string }[];
  faq: { q: string; a: string }[];
};

export type Venue = {
  slug: VenueSlug;
  /** Spain (euros, tuteo) or Argentina (pesos, voseo). */
  locale: "es-ES" | "es-AR";
  /** The two ways to pay in the booking sheet. */
  payments: [PayMethod, PayMethod];
  /** The share of the price paid online to hold the booking (0 to 1); absent = the full price. */
  deposit?: number;
  /** Nothing is paid when booking: the patient pays at the practice and the panel confirms the payment by hand. */
  payAtVenue?: boolean;
  /** One professional only: the booking skips the "con quién" step. */
  solo?: boolean;
  /** The panel has a patients view (a practice with clients that come back). */
  patients?: boolean;
  /** The words for one booking and the place ("cita", "citas", "centro"). */
  words: { appt: string; appts: string; place: string };
  home?: HomeSections;
  /** Optional photos (files in public/booking/<slug>/): when present the customer page is photo-led, with a gallery. */
  photos?: { hero: Photo; gallery: Photo[]; studio: Photo };
  /** Where the booking lives when it is its own page; without it the booking is a section (#reservar) of the home page. */
  bookingPath?: string;
  /** Optional short quotes from customers (example data). */
  reviews?: Review[];
  /** Optional house rules shown next to the address and hours. */
  policies?: string[];
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
  locale: "es-ES",
  payments: ["tarjeta", "bizum"],
  words: { appt: "reserva", appts: "reservas", place: "estudio" },
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
  locale: "es-ES",
  payments: ["tarjeta", "bizum"],
  words: { appt: "cita", appts: "citas", place: "centro" },
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
  bookingPath: "/belleza/reservar",
  // Stock photos from Pexels (free to use, no attribution required): see public/booking/belleza/CREDITS.md.
  photos: {
    hero: { src: "/booking/belleza/hero.webp", alt: "Mano con uñas pintadas en verde suave sobre una manga blanca" },
    gallery: [
      { src: "/booking/belleza/gallery-1.webp", alt: "Uñas rosa nude con líneas de nail art en azul y naranja" },
      { src: "/booking/belleza/gallery-2.webp", alt: "Uñas almendra rosa con pequeños destellos plateados" },
      { src: "/booking/belleza/gallery-3.webp", alt: "Uñas beige brillantes con lazos dorados" },
      { src: "/booking/belleza/gallery-4.webp", alt: "Uñas almendra con purpurina gris y francesa suave" },
      { src: "/booking/belleza/gallery-5.webp", alt: "Manicurista pintando una uña con un pincel fino" },
      { src: "/booking/belleza/gallery-6.webp", alt: "Manicura en tono topo, vista desde arriba" },
    ],
    studio: { src: "/booking/belleza/studio.webp", alt: "Muestrario de colores de esmalte sobre la mesa del centro" },
  },
  reviews: [
    { name: "Laura T.", text: "La manicura rusa me duró tres semanas perfecta. Reservé desde el móvil en un minuto." },
    { name: "Irene S.", text: "Trato muy cuidado y todo impecable. Carla acertó con el diseño a la primera." },
    { name: "Marta G.", text: "Pagas al reservar y llegas sin preocuparte de nada. Vuelvo seguro." },
  ],
  policies: ["Pagas online al reservar; en el centro no se paga nada más.", "Cancela hasta 12 horas antes y te devolvemos el pago.", "Material esterilizado y de un solo uso."],
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

export const nutricion: Venue = {
  slug: "nutricion",
  locale: "es-AR",
  payments: ["efectivo", "transferencia"],
  payAtVenue: true,
  solo: true,
  patients: true,
  words: { appt: "turno", appts: "turnos", place: "consultorio" },
  mode: "services",
  refPrefix: "RAI",
  name: "Raíz Nutrición",
  kind: "Nutrición clínica y deportiva",
  tagline: "Sacá tu turno en un minuto, en el consultorio o por videollamada.",
  address: "Av. Santa Fe 2350, CABA",
  phone: "+54 11 5555 0123",
  rating: "5,0",
  hours: [
    { label: "Lunes a viernes", value: "9:00 a 19:00" },
    { label: "Sábados", value: "9:00 a 13:00" },
    { label: "Domingos", value: "Cerrado" },
  ],
  open: { 1: [hm(9), hm(19)], 2: [hm(9), hm(19)], 3: [hm(9), hm(19)], 4: [hm(9), hm(19)], 5: [hm(9), hm(19)], 6: [hm(9), hm(13)] },
  bookingPath: "/nutricion/reservar",
  reviews: [
    { name: "Carolina M.", text: "Por fin un plan que puedo sostener. Saqué el turno desde el celu y me llegó todo por email." },
    { name: "Julián P.", text: "Hice la primera consulta online y fue igual de completa que en persona. Muy claro todo." },
    { name: "Martina S.", text: "Me armó la alimentación para mis entrenamientos y bajé tiempos en la carrera. Recomendadísima." },
  ],
  policies: ["Reservás sin pagar: abonás en el consultorio, en efectivo o por transferencia.", "Podés cancelar el turno con el link del email, hasta 24 horas antes.", "Las consultas online son por videollamada: te mandamos el link por email."],
  theme: { cream: "#fbf6ee", paper: "#ffffff", blush: "#fbe6d3", brand: "#bd5320", "brand-ink": "#8f3c13", ink: "#2a1e16", muted: "#755f50", line: "#eddfce" },
  staff: [{ id: "sol", name: "Lic. Sol Márquez", role: "Nutricionista" }],
  offers: [
    { id: "primera", name: "Primera consulta", group: "Consultas", minutes: 60, price: 35000, blurb: "Historia clínica, hábitos y objetivos. Te vas con tu plan.", staff: ["sol"], modes: ["presencial", "online"] },
    { id: "seguimiento", name: "Consulta de seguimiento", group: "Consultas", minutes: 40, price: 25000, blurb: "Ajustamos el plan según tu progreso.", staff: ["sol"], modes: ["presencial", "online"] },
    { id: "deportiva", name: "Nutrición deportiva", group: "Deporte", minutes: 60, price: 38000, blurb: "Plan para entrenar y competir: carga, hidratación y recuperación.", staff: ["sol"], modes: ["presencial", "online"] },
    { id: "antropometria", name: "Antropometría y composición corporal", group: "Deporte", minutes: 45, price: 30000, blurb: "Medidas con técnica ISAK: masa muscular y grasa.", staff: ["sol"], modes: ["presencial"] },
    { id: "suplementos", name: "Plan de suplementación", group: "Deporte", minutes: 40, price: 24000, blurb: "Qué tomar, cuánto y cuándo, con respaldo científico.", staff: ["sol"], modes: ["presencial", "online"] },
  ],
  timetable: [],
  windowDays: 30,
  home: {
    steps: [
      { title: "Elegí tu turno", text: "Mirá los días y horarios libres y reservá en un minuto." },
      { title: "Recibí tu email", text: "Te llega con todos los datos del turno y un link para cancelarlo si no podés venir." },
      { title: "Vení a tu consulta", text: "Pagás en el consultorio y, después, te mandamos tu plan por email." },
    ],
    about: {
      name: "Lic. Sol Márquez",
      role: "Licenciada en Nutrición · Mat. 0000/0",
      bio: "Acompaño a personas que quieren comer mejor sin dietas imposibles: desde bajar de peso o ganar masa muscular hasta rendir en el deporte. Cada plan se arma a tu medida y se ajusta en cada consulta.",
      credentials: ["Antropometrista ISAK nivel 2", "Nutrición deportiva avanzada", "Consultas presenciales y online"],
    },
    tips: [
      { tag: "Receta", title: "Panqueques de avena y banana", text: "Tres ingredientes, diez minutos y proteína para arrancar el día." },
      { tag: "Tip", title: "Cómo armar un plato equilibrado", text: "La mitad verduras, un cuarto proteínas y un cuarto carbohidratos." },
      { tag: "Deporte", title: "Qué comer antes de entrenar", text: "Cuánto, cuándo y qué elegir según el tipo de sesión." },
    ],
    faq: [
      { q: "¿Cuánto dura la primera consulta?", a: "Una hora: repasamos tu historia, tus hábitos y tus objetivos, y salís con un plan." },
      { q: "¿Atendés online?", a: "Sí. La consulta por videollamada es igual de completa; te mandamos el link por email." },
      { q: "¿Cómo pago?", a: "Reservar es gratis. Abonás la consulta en el consultorio, en efectivo o por transferencia." },
      { q: "¿Puedo cancelar o cambiar el turno?", a: "Sí: en el email de confirmación hay un link para cancelarlo, hasta 24 horas antes." },
    ],
  },
};

export const venues: Record<VenueSlug, Venue> = { estudio, belleza, nutricion };

/** Where the "reservar" buttons go: the venue's own booking page, or the booking section of its home page. */
export const bookingHref = (venue: Venue) => venue.bookingPath ?? "#reservar";
export const offerOf = (venue: Venue, id: string) => venue.offers.find((o) => o.id === id);
export const staffOf = (venue: Venue, id: string) => venue.staff.find((s) => s.id === id);

const formats = new Map<string, Intl.NumberFormat>();
/** A price in the venue's currency: euros (Spain) or pesos (Argentina), without decimals when they are zero. */
export function money(venue: Venue, n: number) {
  const currency = venue.locale === "es-AR" ? "ARS" : "EUR";
  let f = formats.get(currency);
  if (!f) formats.set(currency, (f = new Intl.NumberFormat(venue.locale, { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 2 })));
  return f.format(n);
}
/** What is paid online to book: the deposit (rounded to 100) or the full price. */
export const depositOf = (venue: Venue, price: number) => (venue.deposit ? Math.round((price * venue.deposit) / 100) * 100 : price);
/** Picks the text for the venue's way of speaking: tuteo (Spain) or voseo (Argentina). */
export const say = (venue: Venue, tu: string, vos: string) => (venue.locale === "es-AR" ? vos : tu);
export const payLabel: Record<PayMethod, string> = { tarjeta: "Tarjeta", bizum: "Bizum", mercadopago: "Mercado Pago", efectivo: "Efectivo", transferencia: "Transferencia" };
