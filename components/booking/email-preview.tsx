import Image from "next/image";
import Link from "next/link";
import { dayLabel, formatTime } from "@/lib/admin-dates";
import type { Booking } from "@/lib/booking/availability";
import { cancelPath, MAIL_IMAGES, templateOf } from "@/lib/booking/emails";
import { money, offerOf, type Venue } from "@/lib/booking/venues";

// The emails of a practice, drawn like an email client. They are examples: nothing is sent.

export function MailFrame({ venue, to, subject, children }: { venue: Venue; to: string; subject: string; children: React.ReactNode }) {
  return (
    <article aria-label={`Email: ${subject}`} className="overflow-hidden rounded-2xl bg-paper ring-1 ring-line">
      <header className="border-b border-line px-4 py-3">
        <h2 className="font-semibold leading-snug">{subject}</h2>
        <div className="mt-2 flex items-center gap-2.5">
          <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-white">
            RN
          </span>
          <p className="min-w-0 text-sm leading-tight">
            <b>{venue.name}</b>
            <span className="block truncate text-muted">para {to}</span>
          </p>
        </div>
      </header>
      <div className="space-y-3 px-4 py-4 text-[15px] leading-relaxed">{children}</div>
    </article>
  );
}

const firstName = (name: string) => name.split(" ")[0];

/** The email the patient gets right after booking: all the data, and the link to cancel. */
export function ConfirmationEmail({ venue, booking, now }: { venue: Venue; booking: Booking; now: number }) {
  const offer = offerOf(venue, booking.offer);
  const rows: [string, string][] = [
    ["Consulta", offer?.name ?? ""],
    ["Cuándo", `${dayLabel(booking.start, now)}, ${formatTime(booking.start)} h`],
    ["Modalidad", booking.modality === "online" ? "Online, por videollamada" : "Presencial, en el consultorio"],
    ["Dónde", booking.modality === "online" ? "Te enviamos el link 15 minutos antes" : venue.address],
    ["Pago", `En el consultorio · ${money(venue, booking.price)}`],
    ["Referencia", booking.ref],
  ];
  return (
    <MailFrame venue={venue} to={booking.email ?? ""} subject={`Tu turno está confirmado · ${offer?.name ?? ""}`}>
      <p>Hola {firstName(booking.name)}, ¡tu turno está confirmado! Estos son tus datos:</p>
      <dl className="divide-y divide-line rounded-xl bg-cream px-3.5">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-4 py-2">
            <dt className="text-sm text-muted">{label}</dt>
            <dd className="text-right text-sm font-medium first-letter:uppercase">{value}</dd>
          </div>
        ))}
      </dl>
      <p>¿No podés venir? Cancelalo con un toque, hasta 24 horas antes:</p>
      <Link href={cancelPath(booking.ref)} data-cta="cancelar-turno" className="block rounded-full border border-brand px-5 py-3 text-center font-semibold text-brand-ink">
        Cancelar mi turno
      </Link>
      <p className="text-sm text-muted">
        {venue.name} · {venue.address}
      </p>
    </MailFrame>
  );
}

/** The email the nutritionist sends after the consultation: a template and the pictures attached. */
export function VisitEmail({ venue, booking, templateId, images }: { venue: Venue; booking: Booking; templateId: string; images: string[] }) {
  const template = templateOf(templateId);
  const attached = MAIL_IMAGES.filter((i) => images.includes(i.id));
  return (
    <MailFrame venue={venue} to={booking.email ?? ""} subject={template.subject}>
      <p>Hola {firstName(booking.name)},</p>
      <p>{template.intro}</p>
      <ul className="list-disc space-y-1 pl-5">
        {template.points.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
      <p>{template.outro}</p>
      {attached.length ? (
        <div aria-label="Archivos adjuntos" className="grid grid-cols-3 gap-2">
          {attached.map((i) => (
            <figure key={i.id} className="overflow-hidden rounded-lg ring-1 ring-line">
              <Image src={i.src} alt={i.label} width={320} height={220} unoptimized className="h-auto w-full" />
              <figcaption className="px-1.5 py-1 text-[11px] text-muted">{i.label}</figcaption>
            </figure>
          ))}
        </div>
      ) : null}
      <p className="text-sm text-muted">Lic. Sol Márquez · {venue.name}</p>
    </MailFrame>
  );
}
