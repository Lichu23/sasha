import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { management } from "@/lib/shop";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  // A shop in management mode has no public store: its URL opens the staff's Caja.
  if (management) redirect("/admin/caja");

  return (
    <>
      <a
        href="#contenido"
        className="sr-only z-50 rounded-full bg-ink px-4 py-2 text-cream focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Saltar al contenido
      </a>
      <SiteHeader />
      <main id="contenido" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
