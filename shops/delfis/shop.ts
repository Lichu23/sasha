import { defineShop } from "../types";

// Catalog and photos imported from Núcleo Check: npm run import-nucleocheck -- 654 delfis

export default defineShop({
  name: "Delfis Pastelería",
  shortName: "Delfis",
  kind: "Pastelería",
  tagline: "Tortas, tartas y postres caseros",
  description: "Tortas, tartas, postres, budines y alfajores de Delfis Pastelería. Encargá online y retirá en el local.",

  address: "Armstrong y Cañada de Gómez, Santa Fe",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Cuffia+1386+Armstrong+Santa+Fe",
  locations: [
    {
      name: "Armstrong",
      address: "Cuffia 1386",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Cuffia+1386+Armstrong+Santa+Fe",
    },
    {
      name: "Cañada de Gómez",
      address: "Ocampo 984",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Ocampo+984+Ca%C3%B1ada+de+G%C3%B3mez+Santa+Fe",
    },
  ],
  // TODO: real WhatsApp number (not public on Instagram or the catalog).
  whatsapp: "5491100000000",
  instagram: "https://www.instagram.com/delfis.pasteleria/",

  wordmark: { src: "/shops/delfis/logo.png", width: 670, height: 270 },
  cover: "/shops/delfis/cover.webp",
  coverAlt: "Vitrina de Delfis Pastelería con tortas, tartas y budines",

  // The logo's lavender (#9187b8) darkened so white text on buttons stays readable,
  // with the menu's pink (#dca4b9) as the soft background tint.
  theme: { brand: "#6b5fa0", brandInk: "#54498a", blush: "#f6dfe8", cream: "#fdf8fa" },

  // TODO: real opening hours.
  hours: {
    lunes: [9, 20],
    martes: [9, 20],
    miercoles: [9, 20],
    jueves: [9, 20],
    viernes: [9, 20],
    sabado: [9, 20],
    domingo: null,
  },

  home: {
    // The neon sign in the shop.
    title: ["¡Lo sé! Se te hace ", "agua", " la boca."],
    intro: "Tortas, tartas, postres, budines y alfajores caseros. Elegí, pagá online y retirá en el local.",
    featured: ["Chocotorta", "Rogel", "Brownie Con Crema y nueces", "Cheesecake Fr New York", "Torta Oreo", "Key lime pie"],
  },

  // The full catalog, to browse.
  salon: {
    name: "Menú",
    summary: "Tortas, tartas, postres, budines y alfajores",
  },

  orders: {
    item: { one: "producto", other: "productos", feminine: false },
    title: "Pastelería por encargo",
    cta: "Hacer un pedido",
    leadTimeHours: 24,
    payment: "mercadopago",
    referencePrefix: "DELFIS",
    notesPlaceholder: "Ej: escribir “Feliz cumple, Juli” en la torta…",
  },

  // A few catalog items have no photo yet; the demo shows only the ones that do.
  hideProductsWithoutPhoto: true,

  admin: true,

  demo: { youtubeId: "095jFol3ey4" },
});
