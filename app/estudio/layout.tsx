import type { Metadata, Viewport } from "next";
import { Figtree, Fraunces } from "next/font/google";
import { VenueShell } from "@/components/booking/venue-shell";
import { estudio } from "@/lib/booking/venues";

// Brisa Studio: a pilates / yoga / training studio. Its own colors and fonts, independent of the shop (SHOP).
const display = Fraunces({ variable: "--font-display", subsets: ["latin"] });
const body = Figtree({ variable: "--font-body", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: `${estudio.name} · Reserva de clases`, template: `%s · ${estudio.name}` },
  description: `Demo: reservas de clases y panel del estudio para ${estudio.name}.`,
};

export const viewport: Viewport = { viewportFit: "cover", themeColor: estudio.theme.brand };

export default function EstudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <VenueShell venue={estudio} fonts={{ display: display.style.fontFamily, body: body.style.fontFamily }}>
      {children}
    </VenueShell>
  );
}
