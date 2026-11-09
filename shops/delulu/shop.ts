import { defineShop } from "../types";

// Menu and prices from their July menu (PDF); cakes and photos from their cake catalog (PDF).
// The catalog has no prices: the take-away prices are TODO placeholders.

export default defineShop({
  name: "DeLulú Pastelería",
  shortName: "DeLulú",
  kind: "Pastelería con amor",
  tagline: "Hecho con amor. Pensado para disfrutar",
  description: "Desayunos, meriendas, almuerzos y tortas enteras de DeLulú Pastelería en Rosario. Encargá tu torta online y retirala en el local.",

  // TODO: confirm the address (from a third-party listing).
  address: "San Juan 3615",
  neighborhood: "Rosario",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=DeLul%C3%BA+Pasteler%C3%ADa+San+Juan+3615+Rosario",
  whatsapp: "5493415040010",
  instagram: "https://www.instagram.com/delulupasteleria/",
  pedidosYa: "https://www.pedidosya.com.ar/restaurantes/rosario/delulu-pasteleria-menu",
  jobsForm: "https://docs.google.com/forms/d/e/1FAIpQLSfErIpE45ClASjim4Xh2pyfFDUaPB2PvqKniOiRvFe2ApvrkQ/viewform",

  logo: "/shops/delulu/logo.webp",
  cover: "/shops/delulu/hero.webp",
  coverAlt: "Torta brownie de DeLulú con merengue, dulce de leche, oreos, cubanitos y chocolatitos",

  // The deep teal of their menu and catalog, with the logo's mint as the soft tint.
  theme: {
    brand: "#13695c",
    brandInk: "#0d5248",
    blush: "#dcefe8",
    cream: "#f9fcfb",
    ink: "#12352f",
    muted: "#52716b",
    line: "#d5e7e1",
  },

  // TODO: real opening hours (lunch is 12 to 15; baked potatoes "los sábados").
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
    // The closing line of their lemon pie poster.
    title: ["Hecho con ", "amor", ". Pensado para disfrutar."],
    intro: "Desayunos, meriendas, almuerzos y tortas enteras para tu evento. Elegí, pagá online y retirá en el local.",
    featured: ["Lemon pie", "Brownie Victoria", "Torta Óreo", "Cheesecake", "Rogel", "Red velvet"],
  },

  salon: {
    name: "Menú",
    summary: "Desayunos, meriendas, almuerzos y cafetería",
  },

  orders: {
    item: { one: "torta", other: "tortas", feminine: true },
    title: "Tortas por encargo",
    cta: "Encargar una torta",
    leadTimeHours: 48,
    payment: "mercadopago",
    referencePrefix: "DELULU",
    notesPlaceholder: "Ej: escribir “Feliz cumple, Juli” en la torta…",
    salonUpsell: "¿Querés la torta entera para tu evento?",
  },

  admin: true,

  demo: { youtubeId: "U65yiX32oVk" },
});
