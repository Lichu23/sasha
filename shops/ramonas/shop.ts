import { defineShop } from "../types";

export default defineShop({
  name: "Ramonas Pastelería",
  shortName: "Ramonas",
  kind: "Pastelería",
  tagline: "Pastelería para sorprender, en La Plata",
  description: "Tortas, cajitas y dulces para cumpleaños, regalos y celebraciones en La Plata.",

  // Their bio only says "La Plata, Buenos Aires" and "pedidos por mensaje privado": the pickup address, the hours
  // and the WhatsApp number are placeholders for the demo. Fill them in with the real ones before they use it.
  address: "La Plata, Buenos Aires",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Ramonas+Pasteleria+La+Plata",
  whatsapp: "",
  instagram: "https://www.instagram.com/ramonascakesandsweets",

  logo: "/shops/ramonas/logo.jpg",
  cover: "/shops/ramonas/cover.jpg",
  coverAlt: "Torta Oreo con chocolate",

  // Their logo is charcoal on white: a warm near-black for buttons, soft chocolate tints for the rest.
  theme: {
    brand: "#34302e",
    brandInk: "#1d1a19",
    blush: "#ece5e0",
    cream: "#fbf9f7",
    ink: "#2b2826",
    muted: "#756d68",
    line: "#e6dfd9",
  },

  hours: {
    lunes: [9, 18],
    martes: [9, 18],
    miercoles: [9, 18],
    jueves: [9, 18],
    viernes: [9, 18],
    sabado: [9, 14],
    domingo: null,
  },

  home: {
    title: ["Pastelería para ", "sorprender", "."],
    intro: "Tortas, cajitas y dulces para cumpleaños, regalos y celebraciones. También hacemos pastelería para cafeterías y comercios.",
    featured: ["Torta Oreo", "Torta Red Velvet", "Torta Chocolate y dulce de leche", "Key Lime Pie", "Cheesecake de frutos rojos"],
  },

  orders: {
    item: { one: "torta", other: "tortas", feminine: true },
    title: "Tortas por encargo",
    leadTimeHours: 48,
    payment: "mercadopago",
    referencePrefix: "RAMONAS",
    namePrefix: "Torta ",
    sizeLegend: "Tamaño de la torta",
    sizePrefix: "Torta de",
    sizeNotes: { "18cm": "≈ 8 porciones", "24cm": "≈ 14 porciones" },
    notesPlaceholder: "Ej: escribir “Feliz cumple, Lu” en la torta…",
  },

  admin: true,
});
