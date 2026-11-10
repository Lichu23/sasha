import { defineShop } from "../types";

// Menu and prices from their PDF menu. The take-away boxes are priced as quantity × the menu's unit price
// (macarons, cookies, alfajores, medialunas, croissants, NY rolls) and the brunch is their "brunch para tres
// personas". Colors and fonts come from the same menu: bordeaux and dusty pink, Garamond over PT Sans.
// TODO: confirm the street address, WhatsApp (placeholder) and Thursday-to-Sunday hours (only Monday to
// Wednesday show on their Instagram); the product photos are from their Instagram feed.

export default defineShop({
  name: "Livings Café & Deco",
  shortName: "Livings",
  kind: "Café y deco",
  tagline: "Café de especialidad, bakery y deco en Luján",
  description: "Café de especialidad, brunch, bakery y almuerzos en Livings Café & Deco, Luján. Mirá el menú y encargá cajas dulces, medialunas o un brunch para retirar.",

  address: "Luján, Buenos Aires",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Livings+Caf%C3%A9+%26+Deco+Luj%C3%A1n",
  whatsapp: "5492323000000",
  instagram: "https://www.instagram.com/livingscafeydeco/",

  wordmark: { src: "/shops/livings/wordmark.png", width: 980, height: 230 },
  cover: "/shops/livings/hero.webp",
  coverAlt: "Mesa con sillas de caña y tapizado bordó frente a la pared blanca con formas bordó de Livings",

  // The bordeaux of the logo, with the dusty pink and warm cream of the menu.
  theme: {
    brand: "#7f1342",
    brandInk: "#5e0e31",
    blush: "#f2ddd8",
    cream: "#f9f5f2",
    ink: "#3a1c2a",
    muted: "#6f5560",
    line: "#ead6d1",
  },

  hours: {
    lunes: [8, 21],
    martes: [8, 24],
    miercoles: [8, 21],
    jueves: [8, 21],
    viernes: [8, 21],
    sabado: [8, 21],
    domingo: [8, 21],
  },

  home: {
    title: ["Café, bakery y ", "deco", " en Luján"],
    intro: "Café de especialidad, desayunos, tortas y almuerzos en el salón. Y encargá tu brunch, una caja de macarons o cookies, o medialunas recién horneadas para retirar.",
    featured: ["Brunch para tres personas", "Cookies", "Croissants clásicos", "Macarons"],
  },

  salon: {
    name: "Menú",
    summary: "Café de especialidad, desayunos, tortas, bakery y almuerzos",
  },

  orders: {
    item: { one: "pedido", other: "pedidos", feminine: false },
    title: "Para llevar",
    cta: "Hacer un pedido",
    leadTimeHours: 24,
    payment: "mercadopago",
    referencePrefix: "LIVINGS",
    sizeLegend: "Cantidad",
    notesPlaceholder: "Ej: macarons de pistacho y frambuesa, o café en lugar de té…",
    salonUpsell: "¿Querés llevarte una caja?",
  },

  admin: true,
  demo: {},
});
