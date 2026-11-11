"use server";

import { redirect } from "next/navigation";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { findTakeawayProduct } from "@/lib/menu";
import { isValidPickup } from "@/lib/pickup";
import { hasBranches, leadTimeLabel, lineLabel, locations, needsApproval, paysOnline, shop } from "@/lib/shop";

export type CheckoutState = {
  error?: string;
  fieldErrors?: Partial<Record<"name" | "phone" | "pickup" | "location" | "items", string>>;
  values?: { name: string; phone: string; notes: string };
} | null;

const MAX_LINES = 20;
const MAX_QUANTITY = 10;
const PHONE = /^\+?[\d\s()-]{8,20}$/;

type Item = { productId: number; sizeId: string; quantity: number };

function parseItems(raw: FormDataEntryValue | null): Item[] | null {
  if (typeof raw !== "string" || raw.length > 4000) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed) || parsed.length === 0 || parsed.length > MAX_LINES) return null;
  const items: Item[] = [];
  for (const entry of parsed) {
    if (typeof entry !== "object" || entry === null) return null;
    const { productId, sizeId, quantity } = entry as Record<string, unknown>;
    if (
      !Number.isInteger(productId) ||
      typeof sizeId !== "string" ||
      !Number.isInteger(quantity) ||
      (quantity as number) < 1 ||
      (quantity as number) > MAX_QUANTITY
    ) {
      return null;
    }
    items.push({ productId: productId as number, sizeId, quantity: quantity as number });
  }
  return items;
}

const text = (v: FormDataEntryValue | null, max: number) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

export async function startCheckout(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const name = text(formData.get("name"), 80);
  const phone = text(formData.get("phone"), 20);
  const notes = text(formData.get("notes"), 300);
  const pickup = text(formData.get("pickup"), 40);
  const location = text(formData.get("location"), 80);
  const items = parseItems(formData.get("items"));
  const values = { name, phone, notes };

  const fieldErrors: NonNullable<CheckoutState>["fieldErrors"] = {};
  if (name.length < 2) fieldErrors.name = "Contanos quién retira el pedido.";
  if (!PHONE.test(phone)) fieldErrors.phone = "Ingresá un teléfono válido, por ejemplo 11 2345-6789.";
  if (!isValidPickup(pickup, Date.now())) {
    fieldErrors.pickup = leadTimeLabel
      ? `Elegí un horario de retiro con al menos ${leadTimeLabel} de anticipación.`
      : "Elegí un horario de retiro disponible.";
  }
  if (hasBranches && !locations.some((l) => l.name === location)) fieldErrors.location = "Elegí en qué local lo retirás.";
  if (!items) fieldErrors.items = "Tu pedido está vacío.";
  if (Object.keys(fieldErrors).length) return { fieldErrors, values };

  // Prices always come from the catalog on the server, never from the browser.
  const lines = [];
  for (const item of items!) {
    const product = findTakeawayProduct(item.productId);
    const size = product?.sizes.find((s) => s.id === item.sizeId);
    if (!product || !size) return { error: "Uno de los productos ya no está disponible. Revisá tu pedido.", values };
    lines.push({ product, size, quantity: item.quantity });
  }

  const reference = `${shop.orders.referencePrefix}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const resultUrl = (status: string) =>
    `${siteUrl}/pedido?estado=${status}&ref=${reference}&retiro=${encodeURIComponent(pickup)}`;

  if (needsApproval) {
    // Nothing is paid: the order goes to the shop, which confirms it (or not) from /admin.
    redirect(`/pedido?estado=enviado&ref=${reference}&retiro=${encodeURIComponent(pickup)}`);
  }

  if (!paysOnline) {
    // WhatsApp orders: the result page builds the message for the customer to send.
    redirect(`/pedido?estado=whatsapp&ref=${reference}&retiro=${encodeURIComponent(pickup)}`);
  }

  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    // No Mercado Pago credentials: go to the simulated checkout so the demo still flows end to end.
    const total = lines.reduce((sum, l) => sum + l.size.price * l.quantity, 0);
    redirect(`/checkout?ref=${reference}&retiro=${encodeURIComponent(pickup)}&total=${total}`);
  }

  let checkoutUrl: string | undefined;
  try {
    const preference = await new Preference(new MercadoPagoConfig({ accessToken })).create({
      body: {
        items: lines.map(({ product, size, quantity }) => ({
          id: `${product.id}-${size.id}`,
          title: lineLabel(product.name, size),
          quantity,
          unit_price: size.price,
          currency_id: "ARS",
          picture_url: product.image ?? undefined,
        })),
        payer: { name },
        external_reference: reference,
        statement_descriptor: shop.name.toUpperCase().slice(0, 22),
        back_urls: {
          success: resultUrl("aprobado"),
          pending: resultUrl("pendiente"),
          failure: resultUrl("rechazado"),
        },
        // Mercado Pago only redirects back automatically to https URLs.
        auto_return: siteUrl.startsWith("https://") ? "approved" : undefined,
        expires: true,
        expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        metadata: { pickup, location, customer_name: name, customer_phone: phone, notes, store: shop.name },
      },
    });
    checkoutUrl = preference.init_point;
  } catch (error) {
    console.error("Mercado Pago preference failed", error);
  }

  if (!checkoutUrl) {
    return { error: "No pudimos conectar con Mercado Pago. Probá de nuevo en unos minutos.", values };
  }
  redirect(checkoutUrl);
}
