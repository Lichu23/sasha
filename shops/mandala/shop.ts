import { defineShop } from "../types";

export default defineShop({
  name: "Mandala Cakes & Coffee",
  shortName: "Mandala",
  kind: "Pastelería y café",
  tagline: "Tortas y café en Córdoba",
  description: "Tortas por encargo, cajitas y dulces para cumpleaños y celebraciones en Córdoba. Retirás en Obispo Salguero o en The Gula House.",

  // Real from their Instagram bio: the two locals, their hours and the handle. The menu, the prices, the photos (free stock
  // photos, credited at /creditos), the WhatsApp number and the logo are placeholders for the demo: replace them with theirs.
  address: "Obispo Salguero 479 y 25 de Mayo 1332, Córdoba",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Mandala+Cakes+Obispo+Salguero+479+Cordoba",
  locations: [
    {
      name: "Take away Obispo Salguero",
      address: "Obispo Salguero 479, Córdoba",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Obispo+Salguero+479+Cordoba",
    },
    {
      name: "The Gula House",
      address: "25 de Mayo 1332, Córdoba",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=25+de+Mayo+1332+Cordoba",
    },
  ],
  whatsapp: "",
  instagram: "https://www.instagram.com/mandalacakes",

  logo: "/shops/mandala/logo.svg",
  cover: "/shops/mandala/cover.jpg",
  coverAlt: "Torta Oreo con chocolate",

  // Their logo is a wine-colored wordmark on soft pink: wine for the buttons, pink tints for the rest.
  theme: {
    brand: "#8b2c3b",
    brandInk: "#681f2c",
    blush: "#f6e3e1",
    cream: "#fdf8f6",
    ink: "#33201f",
    muted: "#7d6663",
    line: "#ecd9d6",
  },

  // Take away: lunes a sábado de 9 a 21. The Gula House opens every day from 9 to 21.
  hours: {
    lunes: [9, 21],
    martes: [9, 21],
    miercoles: [9, 21],
    jueves: [9, 21],
    viernes: [9, 21],
    sabado: [9, 21],
    domingo: [9, 21],
  },

  home: {
    title: ["Tortas y café para ", "celebrar", "."],
    intro: "Tortas por encargo, cajitas y dulces para cumpleaños, regalos y mesas dulces. Pedís online, pagás con Mercado Pago y retirás en el local que te quede cerca.",
    featured: ["Torta Oreo", "Torta Red Velvet", "Torta Chocolate y dulce de leche", "Cajita de macarons x12", "Cheesecake de frutos rojos"],
  },

  orders: {
    item: { one: "torta", other: "tortas", feminine: true },
    title: "Tortas por encargo",
    leadTimeHours: 48,
    payment: "mercadopago",
    referencePrefix: "MANDALA",
    namePrefix: "Torta ",
    sizeLegend: "Tamaño de la torta",
    sizePrefix: "Torta de",
    sizeNotes: { "18cm": "≈ 8 porciones", "24cm": "≈ 14 porciones" },
    notesPlaceholder: "Ej: escribir “Feliz cumple, Cande” en la torta…",
  },

  admin: true,

  // Pitch page at /demo: the video (unlisted on YouTube) and the links to try the store and the panel.
  demo: { youtubeId: "8e-z6SETU1o" },
});
