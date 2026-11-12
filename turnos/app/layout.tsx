import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { DemoBanner } from "@/components/demo-banner";
import { SiteHeader } from "@/components/site-header";
import { WhatsappFab } from "@/components/whatsapp-fab";
import { clinic } from "@/lib/clinic";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: `${clinic.name} · ${clinic.kind}`, template: `%s · ${clinic.name}` },
  description: clinic.description,
  // Sales demo: keep it out of search engines.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: clinic.theme.brand,
  viewportFit: "cover",
};

const theme = {
  "--brand": clinic.theme.brand,
  "--brand-ink": clinic.theme.brandInk,
  "--soft": clinic.theme.soft,
  ...(clinic.theme.ink ? { "--ink": clinic.theme.ink } : {}),
} as React.CSSProperties;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-AR" style={theme} className="antialiased">
      <body className="flex min-h-dvh flex-col">
        <DemoBanner />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-line bg-paper px-4 py-6 text-center text-sm text-muted">
          {clinic.name} · {clinic.address}, {clinic.city}
          {clinic.photos ? (
            <>
              {" · "}
              <Link href="/creditos" className="underline">
                Créditos de las fotos
              </Link>
            </>
          ) : null}
        </footer>
        <WhatsappFab />
      </body>
    </html>
  );
}
