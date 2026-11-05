import { shop } from "@/lib/shop";

/**
 * Products that have a 3D model (a GLB in public/models). The model is already scaled to the real
 * size of the product (metres), so AR shows it at true size. Kept apart from menu.json like
 * stockPhotos. Key: "<shop short name>:<product id>".
 */
const models: Record<string, { src: string; widthCm: number }> = {
  "Cardamomo:4002": { src: "/models/cardamomo-4002.glb", widthCm: 18 },
  "Cardamomo:2009": { src: "/models/cardamomo-brownie.glb", widthCm: 7 },
  "Cardamomo:2011": { src: "/models/cardamomo-cheesecake-porcion.glb", widthCm: 11 },
  "Cardamomo:1005": { src: "/models/cardamomo-chai.glb", widthCm: 9 },
  "Cardamomo:1003": { src: "/models/cardamomo-flat-white.glb", widthCm: 14 },
  "Cardamomo:2004": { src: "/models/cardamomo-pain-au-chocolat.glb", widthCm: 12 },
  "Cardamomo:2005": { src: "/models/cardamomo-roll-canela.glb", widthCm: 9 },
  "Cardamomo:5003": { src: "/models/cardamomo-facturas.glb", widthCm: 25 },
  "Cardamomo:5006": { src: "/models/cardamomo-masa-madre.glb", widthCm: 24 },
  "Cardamomo:2002": { src: "/models/cardamomo-medialuna.glb", widthCm: 11 },
  "Horno Lento:2001": { src: "/models/horno-lento-mousse.glb", widthCm: 18 },
  "Horno Lento:2002": { src: "/models/horno-lento-cheesecake.glb", widthCm: 18 },
  "Horno Lento:2006": { src: "/models/horno-lento-lemon-pie.glb", widthCm: 20 },
  "Horno Lento:2007": { src: "/models/horno-lento-tarta-frutos-rojos.glb", widthCm: 24 },
  "Horno Lento:2009": { src: "/models/horno-lento-budin-banana.glb", widthCm: 22 },
  "Café Ejemplo:2001": { src: "/models/template-torta-porcion.glb", widthCm: 12 },
  "Cardamomo:4003": { src: "/models/cardamomo-4003.glb", widthCm: 24 },
};

/** `widthCm` is the width the GLB was made at; other sizes are scaled from it. */
export function modelFor(productId: number) {
  return models[`${shop.shortName}:${productId}`] ?? null;
}

/** The cm in a size label like "18 cm", or null when it has none. */
export function sizeCm(label: string): number | null {
  const n = parseFloat(label.match(/(\d+(?:[.,]\d+)?)\s*cm/i)?.[1].replace(",", ".") ?? "");
  return Number.isFinite(n) ? n : null;
}
