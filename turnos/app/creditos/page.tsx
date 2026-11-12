import type { Metadata } from "next";
import { clinic } from "@/lib/clinic";

export const metadata: Metadata = { title: "Créditos de las fotos" };

export default function CreditosPage() {
  const photos = [...(clinic.photos?.hero ? [clinic.photos.hero] : []), ...(clinic.photos?.gallery ?? [])];

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-semibold tracking-tight">Créditos de las fotos</h1>
      <p className="mb-6 text-muted">
        Las fotos de esta página de prueba son de otras clínicas y tienen licencia abierta (Wikimedia Commons). Se usan
        solo para mostrar cómo quedaría la página. En una clínica real se reemplazan por fotos propias.
      </p>
      {photos.length === 0 ? (
        <p className="text-sm text-muted">Esta página no usa fotos de terceros.</p>
      ) : (
        <ul className="grid gap-3">
          {photos.map((p) => (
            <li key={p.src} className="rounded-2xl border border-line bg-paper p-4 text-sm">
              <p className="font-medium">{p.credit.title}</p>
              <p className="text-muted">
                {p.credit.author} · {p.credit.license}
              </p>
              <a
                href={p.credit.source}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block break-all text-brand-ink underline"
              >
                Ver el original
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
