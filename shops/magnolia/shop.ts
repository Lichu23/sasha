import { defineShop } from "../types";

// Menu and prices from their PDF (August 2026). Their whole cakes and tarts come from the Instagram
// highlights, which have no prices or sizes. TODO: real cake prices and sizes (these are estimates).

export default defineShop({
  name: "Magnolia Bakery & Coffee",
  shortName: "Magnolia",
  kind: "Panadería y cafetería",
  tagline: "Panadería y cafetería en Fisherton, Rosario",
  description: "Café, panadería y tortas enteras de Magnolia en Fisherton, Rosario. Mirá el menú y encargá tu torta online para retirar.",

  address: "León Miglierini 620",
  neighborhood: "Fisherton, Rosario",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Magnolia+Bakery+%26+Coffe+Le%C3%B3n+Miglierini+620+Rosario",
  whatsapp: "5493417422288",
  instagram: "https://www.instagram.com/magnoliabkrosario/",

  wordmark: { src: "/shops/magnolia/wordmark.png", width: 656, height: 200 },
  cover: "/shops/magnolia/hero.webp",
  coverAlt: "Danish de frutos rojos glaseado, recién salido del horno",

  // magnoliacafeteria.com's palette: crema, espresso and the gold of the word "café" in its hero.
  theme: {
    brand: "#9a6b31",
    brandInk: "#2e2a24",
    blush: "#efe9dc",
    cream: "#fbf8f1",
    ink: "#2e2a24",
    muted: "#5a5248",
    line: "#e6dfcf",
  },

  // The bakery's hours, the longest ones, since orders are picked up there. The café closes at 20.
  hours: {
    lunes: [7.5, 21.5],
    martes: [7.5, 21.5],
    miercoles: [7.5, 21.5],
    jueves: [7.5, 21.5],
    viernes: [7.5, 21.5],
    sabado: [7.5, 21.5],
    domingo: [7.5, 21.5],
  },

  home: {
    title: ["Un buen día comienza con un buen ", "café", ""],
    intro: "Conocé nuestra selección de cafetería, pastelería y productos para disfrutar todos los días. Y encargá tu torta online para retirar en Fisherton.",
    featured: ["Brownie con frutos rojos", "Torta Oreo", "Brownie Bomba", "Rogel", "Lemon Pie", "Tiramisú"],
  },

  salon: {
    name: "Menú",
    summary: "Desayunos, meriendas, dulces y salados. Cafetería hasta las 20 hs",
  },

  orders: {
    item: { one: "torta", other: "tortas", feminine: true },
    title: "Tortas por encargo",
    cta: "Encargar una torta",
    leadTimeHours: 120,
    payment: "mercadopago",
    referencePrefix: "MAGNOLIA",
    namePrefix: "Torta ",
    rules: ["Cada torta se prepara especialmente para quien la encargó."],
    notesPlaceholder: "Ej: escribir “Feliz cumple, Juli” en la torta…",
    salonUpsell: "¿Querés la torta entera?",
  },

  // Quieren la herramienta de gestión, no la tienda online: las chicas cargan las ventas y los pedidos en la caja.
  management: { paymentMethods: ["Efectivo", "Tarjeta", "Mercado Pago", "Transferencia"] },

  admin: true,
});
