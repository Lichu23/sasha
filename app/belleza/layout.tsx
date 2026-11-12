import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import { VenueShell } from "@/components/booking/venue-shell";
import { belleza } from "@/lib/booking/venues";

// Lumi Nails & Beauty: a nail and beauty center. Its own colors and fonts, independent of the shop (SHOP).
const display = Cormorant_Garamond({ variable: "--font-display", subsets: ["latin"], weight: ["500", "600", "700"] });
const body = Jost({ variable: "--font-body", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: `${belleza.name} · Reserva de citas`, template: `%s · ${belleza.name}` },
  description: `Demo: reservas de citas y agenda del centro para ${belleza.name}.`,
};

export const viewport: Viewport = { viewportFit: "cover", themeColor: belleza.theme.brand };

export default function BellezaLayout({ children }: { children: React.ReactNode }) {
  return (
    <VenueShell venue={belleza} fonts={{ display: display.style.fontFamily, body: body.style.fontFamily }}>
      {children}
    </VenueShell>
  );
}
