import { defineShop } from "../types";

// Menu and prices from their PDF menu (linked in their Instagram bio). Items without a price there
// (most hot dishes, pizzas, the kids' menu, affogato, waters) are left out. The take-away boxes are
// priced as quantity × the menu's unit price. Hours from a creator's reel about them.
// TODO: their WhatsApp (not public, this one is a placeholder) and their own product photos
// (these are illustrative).

export default defineShop({
  name: "Bonne Francie",
  shortName: "Bonne Francie",
  kind: "Glace et café",
  tagline: "Un rincón francés en Funes",
  description: "Café a repetir, boulangerie artesanal y platos franceses en Funes. Mirá el menú y encargá croissants, cookies y más para retirar.",

  address: "Candelaria 2125",
  neighborhood: "Funes",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Bonne+Francie+Candelaria+2125+Funes",
  whatsapp: "5493410000000",
  instagram: "https://www.instagram.com/bonnefrancie/",

  wordmark: { src: "/shops/bonne-francie/wordmark.png", width: 957, height: 443 },
  cover: "/shops/bonne-francie/hero.webp",
  coverAlt: "La fachada rosa de Bonne Francie, con faroles y la puerta abierta al salón",

  // The logo's brown and cream, with the pink of their facade as the soft tint.
  theme: {
    brand: "#7a4a35",
    brandInk: "#56301f",
    blush: "#f4e1da",
    cream: "#fbf9ef",
    ink: "#3b2419",
    muted: "#6e5a4f",
    line: "#ebdfd3",
  },

  hours: {
    lunes: [[8, 13], [14.5, 20]],
    martes: [[8, 13], [14.5, 20]],
    miercoles: [[8, 13], [14.5, 20]],
    jueves: [[8, 13], [14.5, 20]],
    viernes: [[8, 13], [14.5, 20]],
    sabado: [[8, 13], [14.5, 20]],
    domingo: [[8, 13], [16, 20]],
  },

  home: {
    title: ["Un rincón ", "francés", " en Funes"],
    intro: "Café a repetir, boulangerie artesanal y platos franceses en el salón. Y encargá tu caja de croissants, cookies o alfajores para retirar.",
    featured: ["Croissants de pistacho y nueces", "Medialunas", "Cookies surtidas", "Rolls de canela"],
  },

  salon: {
    name: "Menú",
    summary: "Café a repetir, boulangerie, tostadas y platos franceses",
  },

  orders: {
    item: { one: "caja", other: "cajas", feminine: true },
    title: "Boulangerie para llevar",
    cta: "Hacer un pedido",
    leadTimeHours: 24,
    payment: "mercadopago",
    referencePrefix: "BONNE",
    sizeLegend: "Cantidad",
    notesPlaceholder: "Ej: croissants sin semillas, o los gustos de las cookies…",
    salonUpsell: "¿Querés llevarte una caja?",
  },

  admin: true,
  demo: { youtubeId: "ZybnQvugyuo" },
});
