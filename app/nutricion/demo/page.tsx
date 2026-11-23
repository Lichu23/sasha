import type { Metadata } from "next";
import Link from "next/link";
import { ArrowIcon } from "@/components/icons";
import { VenueMark } from "@/components/booking/ui";
import { nutricion } from "@/lib/booking/venues";

// The one link sent to a nutritionist in a pitch: the video, the patient's page and the panel together, instead of
// three separate links. Not linked from the site itself.

export const metadata: Metadata = {
  title: "Demo",
  description: `Una demo de página web para ${nutricion.name}: los turnos online, el panel del consultorio y un video de cómo funciona.`,
};

const YOUTUBE_ID = "w-gBFU6KAig";

const steps = [
  {
    href: "/nutricion",
    title: "Ver la página del consultorio",
    text: "Lo que ven tus pacientes: quién sos, las consultas y cómo reservar.",
    action: "Abrir",
  },
  {
    href: "/nutricion/reservar",
    title: "Reservar un turno",
    text: "Hacé una reserva de prueba, como si fueras un paciente. Te llega un email de confirmación de ejemplo.",
    action: "Probar",
  },
  {
    href: "/nutricion/admin",
    title: "Ver el turno en la agenda",
    text: "Abrilo en el mismo celular o computadora: ahí aparece tu turno, la ficha del paciente y las ventas.",
    action: "Abrir",
  },
];

export default function NutricionDemoPage() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:px-6">
      <header className="flex flex-col items-center text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-brand text-white">
          <VenueMark venue={nutricion} size={32} />
        </span>
        <h1 className="mt-6 font-display text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
          Así podría ser la página de {nutricion.name}
        </h1>
        <p className="mt-2 text-muted text-pretty">Turnos online, agenda, fichas de pacientes y ventas en un solo lugar.</p>
      </header>

      <section aria-labelledby="video" className="mt-8">
        <h2 id="video" className="sr-only">
          Video de cómo funciona
        </h2>
        <div className="aspect-video overflow-hidden rounded-2xl bg-ink shadow-lg ring-1 ring-line">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(YOUTUBE_ID)}?rel=0`}
            title={`Video: cómo funciona la página de ${nutricion.name}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            loading="lazy"
            className="size-full"
          />
        </div>
      </section>

      <section aria-labelledby="probar" className="mt-10">
        <h2 id="probar" className="text-center font-display text-2xl font-semibold tracking-tight">
          Probala vos
        </h2>
        <p className="mt-1 text-center text-muted text-pretty">Es una página web de prueba: podés tocar todo. Los datos son de ejemplo.</p>
        <ol className="mt-5 grid gap-3">
          {steps.map(({ href, title, text, action }, i) => (
            <li key={href}>
              <Link
                href={href}
                className="group flex items-center gap-4 rounded-2xl bg-paper p-4 ring-1 ring-line transition-[background-color,transform] [-webkit-tap-highlight-color:transparent] hover:bg-blush active:scale-[0.98] motion-reduce:active:scale-100"
              >
                <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-blush font-display text-lg font-semibold text-brand-ink">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{title}</span>
                  <span className="block text-sm text-muted">{text}</span>
                </span>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors group-hover:bg-brand-ink">
                  {action}
                  <ArrowIcon width={16} height={16} className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <p className="mt-auto pt-10 text-center text-sm text-muted">Demo hecha por Lisandro, desarrollador web.</p>
    </main>
  );
}
