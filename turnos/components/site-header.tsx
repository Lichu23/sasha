import Link from "next/link";
import { clinic } from "@/lib/clinic";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Link href="/" className="text-lg font-semibold tracking-tight text-brand-ink">
          {clinic.name}
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link href="/admin" className="rounded-full px-3 py-2 text-muted hover:text-ink">
            Panel
          </Link>
          <Link
            href="/reservar"
            className="rounded-full bg-brand px-4 py-2 font-medium text-white hover:bg-brand-ink"
          >
            Reservar turno
          </Link>
        </nav>
      </div>
    </header>
  );
}
