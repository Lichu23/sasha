// Everything that changes from one shop to the next lives in shops/<slug>/shop.ts,
// typed by ShopConfig. The app code reads it through lib/shop.ts.

/** Opening and closing hour (24 h): whole hours or half past, e.g. 7.5 for 7:30. */
export type Shift = readonly [opens: number, closes: number];

/** One shift, several for split hours (e.g. [[8, 13], [16, 21]]), or null when closed all day. */
export type DayHours = Shift | readonly Shift[] | null;

export type Week = Record<
  "lunes" | "martes" | "miercoles" | "jueves" | "viernes" | "sabado" | "domingo",
  DayHours
>;

export type ShopConfig = {
  /** Full name, e.g. "Sasha Pasteles". */
  name: string;
  /** How customers call it in a message: "¡Hola Sasha!". */
  shortName: string;
  /** Shown after the name in the browser tab, e.g. "Pastelería y café". */
  kind: string;
  /** One line for the footer. */
  tagline: string;
  /** Meta description for search results and link previews. */
  description: string;

  /** Where to pick up orders. With several branches, use `locations` and summarize them here. */
  address: string;
  /** Neighborhood shown after the address, e.g. "Recoleta". */
  neighborhood?: string;
  mapsUrl: string;
  /** Pickup branches, when there is more than one: customers choose where to pick up. */
  locations?: { name: string; address: string; mapsUrl: string }[];
  /** Phone for calls: value for tel: links, label as shown. */
  phone?: { value: string; label: string };
  /** WhatsApp number with country code, digits only: 5491144753427. */
  whatsapp: string;
  email?: string;
  instagram?: string;
  facebook?: string;
  /** Store page on PedidosYa, for delivery: shown next to "Cómo llegar" and in the footer. */
  pedidosYa?: string;
  /** Job application form ("Trabajá con nosotros"), linked in the footer. */
  jobsForm?: string;

  /** Google Maps rating (e.g. 4.7), shown on the home page. Overrides the one imported with the menu. */
  googleRating?: number;

  /** Square logo. Without one, the header shows the first letter of the name. */
  logo?: string;
  /** Wide logo that already spells the name (transparent PNG). Replaces logo + name in headers. */
  wordmark?: {
    src: string;
    width: number;
    height: number;
    /** Height relative to the round logo (default 1.1). Raise it for a tall, detailed logo that needs the room. */
    scale?: number;
  };
  /** Large photo for the desktop hero. */
  cover: string;
  coverAlt: string;
  /** Hosts allowed for remote photos (logo, cover, menu). Local files in /public need none. */
  remoteImages?: { hostname: string; pathname: string }[];

  /** Brand colors. `brand` carries white text on buttons, so keep it dark enough. */
  theme: {
    brand: string;
    /** Darker brand shade for hover states and text links. */
    brandInk: string;
    /** Soft tint of the brand color for backgrounds. */
    blush: string;
    /** Page background. */
    cream?: string;
    /** Text and dark surfaces (footer, active tab). Defaults to a warm near-black. */
    ink?: string;
    /** Secondary text. */
    muted?: string;
    /** Borders and dividers. */
    line?: string;
  };

  hours: Week;

  home: {
    /** Hero title in three parts: the middle one is highlighted in the brand color. */
    title: readonly [before: string, highlight: string, after: string];
    intro: string;
    /** Product names for "Las favoritas de la casa". Falls back to the first ones with a photo. */
    featured?: string[];
  };

  /** The dine-in menu. Leave out for shops without tables: the Salón page and its links disappear. */
  salon?: {
    /**
     * Name for a menu that isn't only for tables, e.g. "Menú": used in the navigation, the home card
     * and the page title. Leave out for "Salón" / "En el salón" / "Menú del salón".
     */
    name?: string;
    /** What the salón offers, for the home card: "Desayunos, almuerzos, café y mesa dulce". */
    summary: string;
    /** Maximum stay, e.g. "1:45 hs". */
    stayLimit?: string;
  };

  orders: {
    /** What is ordered: { one: "torta", other: "tortas", feminine: true }. */
    item: { one: string; other: string; feminine: boolean };
    /** Page title, e.g. "Tortas por encargo". */
    title: string;
    /** Hours of notice, counting only open days. 0 for same-day orders. */
    leadTimeHours: number;
    /**
     * "whatsapp": the order arrives in the shop's WhatsApp, paid on pickup.
     * "mercadopago": paid online before pickup (simulated while MP_ACCESS_TOKEN is empty).
     */
    payment: "whatsapp" | "mercadopago";
    /** Prefix for order numbers, 2 to 10 capital letters: SASHA-1A2B3C4D. */
    referencePrefix: string;
    /** Home button, e.g. "Hacer un pedido". Defaults to "Encargar una torta" from `item`. */
    cta?: string;
    /** Removed from product names in compact lists: "Torta Rogel" → "Rogel". */
    namePrefix?: string;
    /** Legend over the size options, e.g. "Tamaño del molde". */
    sizeLegend?: string;
    /** Before a size in the cart, e.g. "Molde de" → "Molde de 28 cm". */
    sizePrefix?: string;
    /** Extra info next to each size id, e.g. { "28cm": "≈ 12 porciones" }. */
    sizeNotes?: Record<string, string>;
    /** Extra lines for the notice shown before ordering. */
    rules?: string[];
    /** Example for the comments field. */
    notesPlaceholder?: string;
    /** Closing call to action on the salón menu, e.g. "¿Querés la torta entera?". */
    salonUpsell?: string;
  };

  /** Hide products that have no photo (they stay in menu.json). Handy for demos. */
  hideProductsWithoutPhoto?: boolean;

  /** The orders and sales panel at /admin. */
  admin: boolean;

  /**
   * The pitch page at /demo: one link to send the shop, with the video, the storefront and the panel.
   * `youtubeId` is the part after youtu.be/, e.g. "095jFol3ey4". Without it, the page shows only the links.
   */
  demo?: { youtubeId?: string };
};

export const defineShop = (config: ShopConfig) => config;
