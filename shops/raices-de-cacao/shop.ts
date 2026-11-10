import { defineShop } from "../types";

// Address, hours and brand come from their Instagram (bio and "Horarios" story). The menu, its prices and the
// take-away boxes are assumptions made for the demo, and so is the WhatsApp number. Photos of the alfajores and the
// drinks are from their feed; the rest are illustrative stock photos (credited at /creditos).
// TODO: confirm the menu and prices, the WhatsApp number and the holiday hours (8 to 22) with the shop.

export default defineShop({
  name: "Raíces de Cacao",
  shortName: "Raíces de Cacao",
  kind: "Pastelería artesanal y café",
  tagline: "Pastelería de autor, chocolatería y café de especialidad en San Antonio de Areco",
  description:
    "Pastelería de autor, chocolatería y café de especialidad en San Antonio de Areco. Mirá el menú y encargá alfajores, medialunas, tortas o un box para regalar y retirarlo.",

  address: "Mitre 356, San Antonio de Areco",
  neighborhood: "Centro",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Ra%C3%ADces+de+Cacao+Mitre+356+San+Antonio+de+Areco",
  whatsapp: "5492326000000",
  instagram: "https://www.instagram.com/raicesdecacao/",

  logo: "/shops/raices-de-cacao/logo.webp",
  // The full logo (arch lettering, portrait, name), transparent PNG: it replaces the round logo in the headers.
  wordmark: { src: "/shops/raices-de-cacao/wordmark.png", width: 560, height: 479, scale: 1.45 },
  cover: "/shops/raices-de-cacao/hero.webp",
  coverAlt: "Alfajor de mousse de chocolate y naranja partido al medio, con corazón de caramelo salado",

  // Terracotta and cacao brown of the logo over the warm cream of their stories.
  theme: {
    brand: "#8a4b34",
    brandInk: "#633423",
    blush: "#efe0cf",
    cream: "#f8f1e8",
    ink: "#3b2a22",
    muted: "#765f55",
    line: "#e6d6c4",
  },

  // "Lunes a jueves y domingos 8 a 22, viernes y sábados 8 a 00" (their story).
  hours: {
    lunes: [8, 22],
    martes: [8, 22],
    miercoles: [8, 22],
    jueves: [8, 22],
    viernes: [8, 24],
    sabado: [8, 24],
    domingo: [8, 22],
  },

  home: {
    title: ["Pastelería de autor y ", "cacao", " en Areco"],
    intro:
      "Alfajores, croissants, tortas, chocolatería y café de especialidad en el salón. Y encargá tus alfajores, un box para regalar o medialunas recién horneadas para retirar.",
    featured: ["Alfajor de mousse de chocolate y naranja", "Alfajor de merengue", "Ice latte de frambuesa", "Croissant clásico"],
  },

  salon: {
    name: "Menú",
    summary: "Café de especialidad, desayunos, pastelería de autor y alfajores",
  },

  orders: {
    item: { one: "pedido", other: "pedidos", feminine: false },
    title: "Para llevar",
    cta: "Hacer un pedido",
    leadTimeHours: 24,
    payment: "mercadopago",
    referencePrefix: "RAICES",
    sizeLegend: "Presentación",
    notesPlaceholder: "Ej: alfajores sin nueces, o una tarjeta con el mensaje para regalar…",
    salonUpsell: "¿Querés llevarte una caja?",
  },

  admin: true,
  demo: { youtubeId: "pzPp7uRLw8U" },
});
