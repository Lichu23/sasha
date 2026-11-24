import { defineShop } from "../types";

export default defineShop({
  name: "Alba Pastelería & Cafetería",
  shortName: "Alba",
  kind: "Pastelería y cafetería",
  tagline: "Desayunos, meriendas y tortas por pedido en Neuquén",
  description: "Desayunos, meriendas y tortas por pedido en Mendoza 259, Neuquén Capital.",

  address: "Mendoza 259, Neuquén Capital",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Alba+Pasteleria+y+Cafeteria+Mendoza+259+Neuquen",
  whatsapp: "5492995050912",
  instagram: "https://www.instagram.com/alba.neuquen",

  logo: "/shops/alba/logo.jpg",
  cover: "/shops/alba/cover.jpg",
  coverAlt: "Torta Oreo con chocolate sobre la vitrina de Alba",

  // Their logo: soft pink with charcoal lines. The brand pink is deepened so white text reads on buttons.
  theme: {
    brand: "#c2416f",
    brandInk: "#962f55",
    blush: "#fbd3dd",
    cream: "#fff8f9",
    ink: "#4a4a4d",
    muted: "#7c6b70",
    line: "#f0d6dd",
  },

  hours: {
    lunes: [7, 21],
    martes: [7, 21],
    miercoles: [7, 21],
    jueves: [7, 21],
    viernes: [7, 21],
    sabado: [9, 19],
    domingo: null,
  },

  home: {
    title: ["Desayunos, meriendas y tortas con ", "dulzura", "."],
    intro: "Café y pastelería en pleno centro de Neuquén: desayunos y meriendas en el salón, y tortas por pedido para llevar.",
    featured: ["Torta Oreo", "Torta Red Velvet", "Torta Chocolate y dulce de leche", "Torta Lemon Pie", "Torta Dulce de leche"],
  },

  salon: {
    summary: "Desayunos, meriendas y algo dulce",
  },

  orders: {
    item: { one: "torta", other: "tortas", feminine: true },
    title: "Tortas por encargo",
    leadTimeHours: 48,
    payment: "mercadopago",
    referencePrefix: "ALBA",
    namePrefix: "Torta ",
    sizeLegend: "Tamaño de la torta",
    sizePrefix: "Torta de",
    sizeNotes: { "18cm": "≈ 8 porciones", "24cm": "≈ 14 porciones" },
    notesPlaceholder: "Ej: escribir “Feliz cumple, Sofi” en la torta…",
    salonUpsell: "¿Querés la torta entera?",
  },

  admin: true,

  // Pitch page at /demo: the video (unlisted on YouTube) and the links to try the store and the panel.
  demo: { youtubeId: "Wv9L_OAILaw" },
});
