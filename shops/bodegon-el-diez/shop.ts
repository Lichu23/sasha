import { defineShop } from "../types";

// Taken from their Instagram (@bodegoneldiez): name, "Bodegón con más de 100 años de historia" (shield: "1903"),
// Ov. Lagos y Pellegrini in Rosario, WhatsApp +54 341 785-6121, the Menú / Reservas / Partidos highlights.
// Real: the six dishes and prices from the Menú highlight (menú del lunes $20.000, platos de la casa $18.000-$25.000,
// every plate with dessert), the 2x1 on pastas (Monday and Tuesday night) and on pizzas (Wednesday), the matches.
// Invented for the demo (not theirs, say so when sending it): the hours, the extra dishes and their prices, the seats,
// the sample matches after Newell's vs Talleres.
// TODO before they use it: real hours, real menu and prices, seats of the salón, their own photos.

export default defineShop({
  name: "Bodegón El Diez",
  shortName: "El Diez",
  kind: "Bodegón y cafetería en Rosario",
  tagline: "Bodegón con más de 100 años de historia, en Rosario",
  description: "Cafetería y bodegón con más de 100 años de historia en Ov. Lagos y Pellegrini, Rosario. Mirá el menú y reservá tu mesa.",

  address: "Ov. Lagos y Pellegrini",
  neighborhood: "Rosario",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Bodeg%C3%B3n+El+Diez+Ov.+Lagos+y+Pellegrini+Rosario",
  whatsapp: "543417856121",
  phone: { value: "+543417856121", label: "341 785-6121" },
  email: "reservas@bodegoneldiez.com.ar",
  instagram: "https://www.instagram.com/bodegoneldiez/",

  logo: "/shops/bodegon-el-diez/logo.jpg",
  cover: "/shops/bodegon-el-diez/cover.jpg",
  coverAlt: "Milanesa a caballo con papas fritas",

  // Red and black of the shield, on the cream of their parchment posters.
  theme: {
    brand: "#b3141f",
    brandInk: "#850e17",
    blush: "#f4dfd9",
    cream: "#f7f1e4",
    ink: "#1d1a19",
    muted: "#6a6058",
    line: "#e3d8c4",
  },

  hours: {
    lunes: [8, 24],
    martes: [8, 24],
    miercoles: [8, 24],
    jueves: [8, 24],
    viernes: [8, 24],
    sabado: [8, 24],
    domingo: [9, 24],
  },

  home: {
    title: ["Bodegón con más de ", "100 años", " de historia"],
    intro: "Menú del día, platos de la casa, pastas, pizzas y cafetería en Ov. Lagos y Pellegrini. Reservá tu mesa para el almuerzo, la cena, un cumpleaños o el partido de Newell’s.",
    upright: true,
    featured: ["Milanesa de carne o pollo con tallarines", "Lasagna", "Pastel de carne", "Fugazzeta"],
  },

  // From their stories: 2x1 on pastas Monday and Tuesday night, 2x1 on pizzas on Wednesdays, the menú with dessert.
  promos: [
    { title: "2x1 en pastas", text: "Todos los lunes y martes, turno noche." },
    { title: "2x1 en pizzas", text: "Todos los miércoles." },
    { title: "Menú del día", text: "Comés por $20.000, con postre incluido." },
    { title: "Cumpleaños", text: "Reservas y promociones para tu cumple." },
  ],

  salon: {
    name: "Menú",
    summary: "Menú del día, platos de la casa, pastas, pizzas y cafetería",
  },

  // No take-away: the whole point is the table. 60 seats (a guess), parties up to 12, 2 hours a table.
  // Confirmed at once by email (no WhatsApp in the flow); no deposit, so nothing is charged or refunded.
  reservations: { seats: 60, maxPartySize: 12, stayMinutes: 120, minNoticeHours: 2, confirmation: "email", cancelHours: 3, deposit: false },
  noTakeaway: true,

  // Their post: "Hoy transmitimos Newell's vs Talleres, 17 hr". The next ones are samples.
  matches: [
    { id: "nob-talleres", home: "Newell’s", away: "Talleres", competition: "Liga Profesional", inDays: 3, hour: 17 },
    { id: "nob-central", home: "Newell’s", away: "Rosario Central", competition: "Clásico rosarino", inDays: 10, hour: 19.5 },
    { id: "arg-copa", home: "Argentina", away: "Brasil", competition: "Eliminatorias", inDays: 17, hour: 21 },
  ],

  orders: {
    item: { one: "mesa", other: "mesas", feminine: true },
    title: "Menú",
    leadTimeHours: 0,
    payment: "whatsapp",
    referencePrefix: "ELDIEZ",
  },

  admin: true,
  demo: { youtubeId: "Nmf5ZTI33i8" },
});
