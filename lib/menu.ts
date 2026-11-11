import { menu as data, shop, stockPhotos as stock } from "@/shops/current";

export type Size = { id: string; label: string; price: number };

export type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  sizes: Size[];
  image: string | null;
  /** True when `image` is an illustrative stock photo, not the shop's own. */
  isStockImage: boolean;
};

export type Category = { id: string; name: string; products: Product[] };

export type Review = { author: string; rating: number; text: string; when: string };

export type StockPhoto = { src: string; title: string; author: string; license: string; source: string };

// Openly licensed photos (Wikimedia Commons) for products the shop has no photo of.
// Kept apart from menu.json so re-importing the menu doesn't wipe them.
export const stockPhotos: Record<string, StockPhoto> = stock;

type RawCategory = Omit<Category, "products"> & { products: Omit<Product, "isStockImage">[] };

function withStockImages(categories: RawCategory[]): Category[] {
  return categories
    .map((c) => ({
      ...c,
      products: c.products
        .map((p) => {
          const fallback = p.image ? undefined : stockPhotos[p.id];
          return { ...p, image: p.image ?? fallback?.src ?? null, isStockImage: Boolean(fallback) };
        })
        .filter((p) => p.image || !shop.hideProductsWithoutPhoto),
    }))
    .filter((c) => c.products.length > 0);
}

type MenuFile = { salon: RawCategory[]; takeaway: RawCategory[]; rating: number | null; reviews: Review[] };
const file = data as MenuFile;

export const salonMenu: Category[] = withStockImages(file.salon);
export const takeawayMenu: Category[] = withStockImages(file.takeaway);
/** Everything the shop sells, for the staff's Caja (ids are unique across both menus). */
export const posMenu: Category[] = [...salonMenu, ...takeawayMenu];
export const rating: number | null = shop.googleRating ?? file.rating;
export const reviews: Review[] = file.reviews;

const takeawayById = new Map(takeawayMenu.flatMap((c) => c.products).map((p) => [p.id, p]));

export function findTakeawayProduct(id: number) {
  return takeawayById.get(id);
}

/** Slug used for in-page category anchors. */
export function categorySlug(name: string) {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const ars = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function formatPrice(value: number) {
  return ars.format(value);
}
