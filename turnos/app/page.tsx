import Image from "next/image";
import Link from "next/link";
import { clinic } from "@/lib/clinic";
import { formatPrice } from "@/lib/dates";

const initials = (name: string) =>
  name
    .replace(/^(Dr|Dra)\.?\s+/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

const steps = [
  { title: "Elegí el servicio", text: `Y el profesional que prefieras. Ves la duración y el precio desde.` },
  { title: "Elegí día y hora", text: "Solo aparecen los horarios libres, en tiempo real." },
  { title: "Confirmá tus datos", text: `Te llega la confirmación y podés cancelar hasta ${clinic.cancelUntilHours} h antes.` },
];

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-4 shrink-0 text-brand-ink" fill="currentColor" aria-hidden="true">
      <path d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.8 3.8 6.8-6.8a1 1 0 0 1 1.4 0Z" />
    </svg>
  );
}

export default function HomePage() {
  return (
    <>
      <section className="bg-soft px-4 py-12 sm:py-16">
        <div
          className={`mx-auto max-w-5xl ${clinic.photos?.hero ? "grid items-center gap-8 md:grid-cols-[1.1fr_1fr]" : ""}`}
        >
          <div>
          <p className="mb-2 text-sm font-medium uppercase tracking-wide text-brand-ink">{clinic.kind}</p>
          <h1 className="max-w-2xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl">{clinic.tagline}</h1>
          <p className="mt-4 max-w-xl text-pretty text-lg text-muted">{clinic.description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/reservar"
              className="rounded-full bg-brand px-6 py-3 font-medium text-white hover:bg-brand-ink"
            >
              Reservar turno
            </Link>
            <a
              href={`https://wa.me/${clinic.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-brand px-6 py-3 font-medium text-brand-ink hover:bg-white"
            >
              Escribir por WhatsApp
            </a>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink">
            <li className="flex items-center gap-1.5">
              <CheckIcon /> Reservás online, a cualquier hora
            </li>
            <li className="flex items-center gap-1.5">
              <CheckIcon /> Confirmación por mail
            </li>
            <li className="flex items-center gap-1.5">
              <CheckIcon /> Cancelás hasta {clinic.cancelUntilHours} h antes
            </li>
          </ul>
          </div>
          {clinic.photos?.hero ? (
            <Image
              src={clinic.photos.hero.src}
              width={clinic.photos.hero.width}
              height={clinic.photos.hero.height}
              alt={clinic.photos.hero.alt}
              priority
              sizes="(min-width: 768px) 460px, 100vw"
              className="aspect-[4/3] w-full rounded-3xl object-cover shadow-md"
            />
          ) : null}
        </div>
      </section>

      {clinic.photos?.gallery && clinic.photos.gallery.length > 0 ? (
        <section className="mx-auto max-w-5xl px-4 pt-12">
          <h2 className="mb-5 text-2xl font-semibold">Conocé la clínica</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {clinic.photos.gallery.map((p) => (
              <li key={p.src}>
                <Image
                  src={p.src}
                  width={p.width}
                  height={p.height}
                  alt={p.alt}
                  sizes="(min-width: 640px) 496px, 100vw"
                  className="aspect-[4/3] w-full rounded-2xl border border-line object-cover"
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="mb-5 text-2xl font-semibold">Reservá en 3 pasos</h2>
        <ol className="grid gap-3 sm:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="rounded-2xl border border-line bg-paper p-4">
              <span
                className="mb-3 flex size-8 items-center justify-center rounded-full bg-soft text-sm font-semibold text-brand-ink"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <h3 className="font-medium">{s.title}</h3>
              <p className="mt-1 text-sm text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-12">
        <h2 className="mb-5 text-2xl font-semibold">Servicios</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {clinic.services.map((s) => (
            <li key={s.id} className="rounded-2xl border border-line bg-paper p-4">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-medium">{s.name}</h3>
                <span className="shrink-0 text-sm font-medium text-brand-ink">desde {formatPrice(s.priceFrom)}</span>
              </div>
              <p className="mt-1 text-sm text-muted">
                {s.minutes} min · {s.description}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">Precios de ejemplo.</p>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-12">
        <h2 className="mb-5 text-2xl font-semibold">Equipo</h2>
        <ul className="grid gap-3 sm:grid-cols-3">
          {clinic.professionals.map((p) => (
            <li key={p.id} className="flex items-center gap-3 rounded-2xl border border-line bg-paper p-4">
              <span
                className="flex size-12 shrink-0 items-center justify-center rounded-full bg-soft text-base font-semibold text-brand-ink"
                aria-hidden="true"
              >
                {initials(p.name)}
              </span>
              <div className="min-w-0">
                <p className="font-medium">{p.name}</p>
                <p className="text-sm text-muted">{p.role}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {clinic.coverages.length > 0 ? (
        <section className="mx-auto max-w-5xl px-4 pb-12">
          <h2 className="mb-4 text-2xl font-semibold">Obras sociales y prepagas</h2>
          <ul className="flex flex-wrap gap-2">
            {clinic.coverages.map((c) => (
              <li key={c} className="rounded-full border border-line bg-paper px-4 py-1.5 text-sm">
                {c}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {clinic.faq && clinic.faq.length > 0 ? (
        <section className="mx-auto max-w-5xl px-4 pb-12">
          <h2 className="mb-5 text-2xl font-semibold">Preguntas frecuentes</h2>
          <div className="grid gap-2">
            {clinic.faq.map((f) => (
              <details key={f.question} className="group rounded-2xl border border-line bg-paper px-4 py-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-medium [&::-webkit-details-marker]:hidden">
                  {f.question}
                  <svg
                    viewBox="0 0 20 20"
                    className="size-4 shrink-0 text-muted transition-transform group-open:rotate-180 motion-reduce:transition-none"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4Z" />
                  </svg>
                </summary>
                <p className="mt-2 text-sm text-muted">{f.answer}</p>
              </details>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mx-auto grid max-w-5xl gap-6 px-4 pb-12 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-paper p-5">
          <h2 className="mb-3 text-lg font-semibold">Horarios</h2>
          <dl className="grid gap-1 text-sm">
            {clinic.hours.map((h) => (
              <div key={h.label} className="flex justify-between gap-3">
                <dt className="text-muted">{h.label}</dt>
                <dd>{h.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="rounded-2xl border border-line bg-paper p-5">
          <h2 className="mb-3 text-lg font-semibold">Contacto</h2>
          <p className="text-sm">
            {clinic.address}, {clinic.city}
          </p>
          <p className="mt-1 text-sm">
            <a href={`tel:${clinic.phone.replace(/[^\d+]/g, "")}`} className="text-brand-ink underline">
              {clinic.phone}
            </a>
          </p>
        </div>
      </section>

      <section className="bg-brand px-4 py-12 text-center text-white">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-balance text-2xl font-semibold sm:text-3xl">¿Listo para tu próximo turno?</h2>
          <p className="mt-2 text-pretty text-white/90">Reservá en menos de un minuto, sin llamadas ni esperas.</p>
          <Link
            href="/reservar"
            className="mt-6 inline-block rounded-full bg-white px-7 py-3 font-medium text-brand-ink hover:bg-soft"
          >
            Reservar turno
          </Link>
        </div>
      </section>
    </>
  );
}
