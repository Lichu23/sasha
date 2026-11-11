import { defineShop } from "../types";

// Santa Marta confitería y cafetería, Belgrano 3441, San Martín (Buenos Aires). Menu from a photo of their
// printed menu. The prices are EXAMPLE prices: the photo's prices (old) × 1.4, rounded to $100, to match what similar
// shops charge now. Replace them with the owner's real prices before going live. The take-away quantities
// (media docena / docena) are the unit price × the quantity. Opening hours from
// their Instagram bio, phone from their public listing.
// TODO: their WhatsApp (this one is a placeholder), their own product photos (these are illustrative) and the
// details of the specialty coffees and the "triples especiales", which were hard to read in the photo.

export default defineShop({
  name: "Confitería Santa Marta",
  shortName: "Santa Marta",
  kind: "Confitería y cafetería",
  tagline: "Confitería y cafetería en San Martín",
  description: "Café, desayunos, sándwiches de miga, milanesas y pizzas en San Martín. Mirá la carta y pedí para retirar en Santa Marta.",

  address: "Belgrano 3441",
  neighborhood: "San Martín",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Confiter%C3%ADa+Santa+Marta+Belgrano+3441+San+Mart%C3%ADn",
  phone: { value: "+541147556398", label: "(011) 4755-6398" },
  whatsapp: "5491100000000",
  instagram: "https://www.instagram.com/confiteriasantamarta/",

  wordmark: { src: "/shops/santa-marta/wordmark.png", width: 1070, height: 423 },
  cover: "/shops/santa-marta/hero.webp",
  coverAlt: "Un café con leche y medialunas sobre la mesa",

  // The logo's chocolate brown, with the rosy pink of its background as the soft tint.
  theme: {
    brand: "#7a3b38",
    brandInk: "#5a2826",
    blush: "#f6e2e1",
    cream: "#fdf7f5",
    ink: "#3d2220",
    muted: "#7a5c58",
    line: "#ecdbd7",
  },

  hours: {
    lunes: [8, 20],
    martes: [8, 20],
    miercoles: [8, 20],
    jueves: [8, 20],
    viernes: [8, 20],
    sabado: [8, 20],
    domingo: null,
  },

  home: {
    title: ["Tu confitería de ", "siempre", " en San Martín"],
    intro: "Café, desayunos y meriendas en el salón. Y pedí para llevar sándwiches de miga, empanadas, pizzas y tartas.",
    featured: ["Triples comunes", "Pizza Santa Marta", "Empanadas de carne", "Facturas surtidas"],
  },

  salon: {
    name: "Carta",
    summary: "Café, desayunos, sándwiches, milanesas, ensaladas y pizzas",
  },

  orders: {
    item: { one: "pedido", other: "pedidos", feminine: false },
    title: "Pedidos para llevar",
    cta: "Hacer un pedido",
    leadTimeHours: 2,
    payment: "mercadopago",
    referencePrefix: "SANTAMARTA",
    sizeLegend: "Tamaño o cantidad",
    sizeNotes: { mediadocena: "6 unidades", docena: "12 unidades" },
    notesPlaceholder: "Ej: los gustos de las empanadas, o el surtido de facturas…",
    salonUpsell: "¿Querés llevarte algo?",
  },

  admin: true,
  demo: { youtubeId: "vvjD-frQeNU" },
});
