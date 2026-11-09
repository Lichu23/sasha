import { defineShop } from "../types";

// No public catalog: menu.json is a sample menu with illustrative Wikimedia Commons photos
// (credited in stock-photos.json). Swap it for theirs with: npm run menu-from-csv -- cardamomo <csv>

export default defineShop({
  name: "Cardamomo",
  shortName: "Cardamomo",
  kind: "Pastelería y café",
  tagline: "Fábrica de drogas dulces y saladas",
  description: "Café, panadería de manteca, tortas y salados de Cardamomo. Encargá online y retirá en el local.",

  address: "Agrelo y Matheu",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Cardamomo+Agrelo+y+Matheu",
  // TODO: real WhatsApp number (not public on Instagram).
  whatsapp: "5491100000000",
  instagram: "https://www.instagram.com/cardamomo.pasteleria/",

  logo: "/shops/cardamomo/logo.webp",
  cover: "/shops/cardamomo/hero.webp",
  // Their Instagram illustration, padded with white so the tall hero frame never crops its lettering.
  coverAlt: "Ilustración de Cardamomo: una chica caminando dentro de una medialuna gigante, con el lema “Fábrica de drogas dulces y saladas”",

  // The navy of the logo and the awnings, on a warm white.
  theme: {
    brand: "#163452",
    brandInk: "#0f2439",
    blush: "#e3eaf2",
    cream: "#fbfaf6",
    ink: "#132233",
    muted: "#56657a",
    line: "#dfe5ec",
  },

  // From their Instagram. Weekends are "de corrido": TODO confirm 8 to 21.
  hours: {
    lunes: null,
    martes: [[8, 13], [16, 21]],
    miercoles: [[8, 14], [16, 21]],
    jueves: [[8, 14], [16, 21]],
    viernes: [[8, 14], [16, 21]],
    sabado: [8, 21],
    domingo: [8, 21],
  },

  home: {
    // The slogan around the logo.
    title: ["Fábrica de drogas ", "dulces", " y saladas."],
    intro: "Café, panadería de manteca, tortas y salados. Elegí, pagá online y retirá en la esquina.",
    featured: ["Caja de rollos de cardamomo", "Cheesecake de frutos rojos", "Docena de medialunas", "Chocotorta", "Lemon pie", "Carrot cake"],
  },

  salon: {
    name: "Menú",
    summary: "Café, desayunos, meriendas y salados",
  },

  orders: {
    item: { one: "producto", other: "productos", feminine: false },
    title: "Pastelería por encargo",
    cta: "Hacer un pedido",
    leadTimeHours: 24,
    payment: "mercadopago",
    referencePrefix: "CARDAMOMO",
    sizeLegend: "Tamaño",
    notesPlaceholder: "Ej: escribir “Feliz cumple, Juli” en la torta…",
  },

  admin: true,

  demo: { youtubeId: "9GMn6r5Bnnc" },
});
