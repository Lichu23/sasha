import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SimulatedWhatsapp } from "@/components/whatsapp/simulated-chat";
import { REFERENCE, simulatedWhatsapp } from "@/lib/shop";

export const metadata: Metadata = { title: "WhatsApp" };

// The browser bar takes WhatsApp's green on this page.
export const viewport: Viewport = { themeColor: "#008069", viewportFit: "cover" };

// The demo's WhatsApp: only shops with `orders.simulatedWhatsapp` have it (the others open the real one).
export default function WhatsappPage({ searchParams }: PageProps<"/whatsapp">) {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#efeae2]" />}>
      <Chat searchParams={searchParams} />
    </Suspense>
  );
}

async function Chat({ searchParams }: Pick<PageProps<"/whatsapp">, "searchParams">) {
  if (!simulatedWhatsapp) notFound();
  const params = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const ref = one(params.ref);
  return <SimulatedWhatsapp reference={REFERENCE.test(ref) ? ref : null} view={one(params.vista) === "local" ? "local" : "cliente"} />;
}
