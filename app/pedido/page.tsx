import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderResult, type OrderStatus } from "@/components/order-result";
import { REFERENCE } from "@/lib/shop";

export const metadata: Metadata = { title: "Tu pedido" };

const STATUS: Record<string, OrderStatus> = {
  aprobado: "approved",
  demo: "demo",
  pendiente: "pending",
  rechazado: "rejected",
  whatsapp: "whatsapp",
};


export default function OrderPage({ searchParams }: PageProps<"/pedido">) {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-cream" />}>
      <Result searchParams={searchParams} />
    </Suspense>
  );
}

async function Result({ searchParams }: Pick<PageProps<"/pedido">, "searchParams">) {
  const params = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

  // These values only drive what we show. Payment confirmation for the shop
  // comes from Mercado Pago itself, never from this URL.
  const status = STATUS[one(params.estado)] ?? "rejected";
  const ref = one(params.ref);
  const pickup = Date.parse(one(params.retiro));

  return (
    <OrderResult
      status={status}
      reference={REFERENCE.test(ref) ? ref : null}
      pickup={Number.isNaN(pickup) ? null : pickup}
    />
  );
}
