import type { Metadata, Viewport } from "next";
import { Lora, Nunito_Sans } from "next/font/google";
import { VenueShell } from "@/components/booking/venue-shell";
import { nutricion } from "@/lib/booking/venues";

// Raíz Nutrición: a nutritionist's practice. Its own colors and fonts, independent of the shop (SHOP).
const display = Lora({ variable: "--font-display", subsets: ["latin"], weight: ["500", "600", "700"] });
const body = Nunito_Sans({ variable: "--font-body", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: `${nutricion.name} · Turnos online`, template: `%s · ${nutricion.name}` },
  description: `Demo: turnos online, pagos y panel del consultorio para ${nutricion.name}.`,
};

export const viewport: Viewport = { viewportFit: "cover", themeColor: nutricion.theme.brand };

export default function NutricionLayout({ children }: { children: React.ReactNode }) {
  return (
    <VenueShell venue={nutricion} fonts={{ display: display.style.fontFamily, body: body.style.fontFamily }}>
      {children}
    </VenueShell>
  );
}
