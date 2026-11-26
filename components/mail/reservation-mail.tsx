import Image from "next/image";
import Link from "next/link";
import { cancelDeadline, cancelHours, type Reservation } from "@/lib/reservations";
import { reservations, shop } from "@/lib/shop";

// The emails of a table reservation, as the customer reads them (inside <GmailMobile>). They are examples: nothing is
// sent. Three moments: the confirmation (with the cancel link and what happens with the money), a change the shop made,
// and the cancellation.

export type MailKind = "confirmacion" | "modificacion" | "cancelacion";

const AR = "America/Argentina/Buenos_Aires";
const dayFormat = new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long", timeZone: AR });
const timeFormat = new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: AR });
const shortFormat = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: AR });

const cap = (s: string) => s.replace(/^./, (c) => c.toUpperCase());
const day = (t: number) => cap(dayFormat.format(t));
const time = (t: number) => `${timeFormat.format(t)} hs`;
const party = (n: number) => `${n} ${n === 1 ? "persona" : "personas"}`;
const firstName = (name: string) => name.split(" ")[0];

export const mailSubject = (kind: MailKind) =>
  ({
    confirmacion: `Tu mesa está reservada · ${shop.name}`,
    modificacion: `Cambiamos tu reserva · ${shop.name}`,
    cancelacion: `Tu reserva fue cancelada · ${shop.name}`,
  })[kind];

/** "26 nov, 10:42": when the message arrived. */
export const mailSentLabel = (r: Reservation, kind: MailKind, now: number) =>
  shortFormat.format(kind === "confirmacion" ? r.createdAt : now).replace(".", "");

const btn = "block rounded-full px-5 py-3.5 text-center text-[15px] font-semibold";

function Details({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="divide-y divide-[#e6dcc8] rounded-2xl bg-[#f7f1e4] px-4">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-baseline justify-between gap-4 py-2.5">
          <dt className="text-sm text-[#6a6058]">{label}</dt>
          <dd className="text-right text-sm font-semibold">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** What happens with the money, in words: nothing is charged without a deposit. */
function MoneyNote({ cancelled }: { cancelled: boolean }) {
  const deposit = reservations?.deposit;
  return (
    <div className="rounded-2xl border border-[#e6dcc8] p-4 text-sm leading-relaxed">
      <p className="font-semibold">Cancelación y reintegro</p>
      {deposit ? (
        <p className="mt-1 text-[#4a423b]">
          {cancelled
            ? "Te reintegramos la seña completa en el mismo medio de pago, en 5 a 10 días hábiles."
            : "Si cancelás hasta 48 horas antes, te reintegramos la seña completa en el mismo medio de pago, en 5 a 10 días hábiles."}
        </p>
      ) : (
        <p className="mt-1 text-[#4a423b]">
          {cancelled
            ? "Esta reserva no tenía seña: no se te cobró nada, así que no hay nada para reintegrar."
            : `Esta reserva no tiene seña: no se te cobra nada, así que no hay nada para reintegrar. Si no podés venir, cancelala hasta ${cancelHours} horas antes y liberamos tu mesa.`}
        </p>
      )}
    </div>
  );
}

export function ReservationMail({ r, kind }: { r: Reservation; kind: MailKind }) {
  const deadline = cancelDeadline(r);
  const rows: [string, string][] = [
    ["Día", day(r.at)],
    ["Hora", time(r.at)],
    ["Personas", party(r.people)],
    ["A nombre de", r.name],
    ["Reserva", r.ref],
  ];
  if (r.notes) rows.push(["Comentarios", r.notes]);

  return (
    <article aria-label={`Email: ${mailSubject(kind)}`} className="text-[15px] leading-relaxed" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
      <div className="flex items-center gap-3 bg-[#1d1a19] px-5 py-4 text-white">
        {shop.logo ? <Image src={shop.logo} alt="" width={44} height={44} className="size-11 rounded-full bg-white" /> : null}
        <div>
          <p className="font-display text-xl leading-tight">{shop.name}</p>
          <p className="text-xs text-white/70">Bodegón · Cafetería · desde 1903</p>
        </div>
      </div>
      <div className="h-1.5 bg-[#b3141f]" />

      <div className="space-y-4 px-5 py-5">
        {kind === "confirmacion" ? (
          <>
            <h2 className="font-display text-[26px] leading-8">¡Tu mesa está reservada!</h2>
            <p>Hola {firstName(r.name)}, ya tenés tu lugar en {shop.name}. Estos son los datos:</p>
            <Details rows={rows} />
            <a href={shop.mapsUrl} target="_blank" rel="noreferrer" className={`${btn} bg-[#b3141f] text-white`}>
              Cómo llegar · {shop.address}
            </a>
            <p className="text-sm text-[#4a423b]">
              Tu mesa te espera hasta 15 minutos pasada la hora. Si vas a llegar más tarde, avisanos por WhatsApp al {shop.phone?.label}.
            </p>
            <MoneyNote cancelled={false} />
            <div>
              <p className="mb-2 text-sm">
                ¿No podés venir? Cancelala con un toque, hasta el {day(deadline).toLowerCase()} a las {time(deadline)}:
              </p>
              <Link href={`/reservas/cancelar?ref=${encodeURIComponent(r.ref)}`} data-cta="cancelar-reserva" className={`${btn} border-2 border-[#b3141f] text-[#b3141f]`}>
                Cancelar mi reserva
              </Link>
            </div>
          </>
        ) : null}

        {kind === "modificacion" ? (
          <>
            <h2 className="font-display text-[26px] leading-8">Cambiamos tu reserva</h2>
            <p>Hola {firstName(r.name)}, hicimos un cambio en tu reserva. Así queda:</p>
            {r.requested ? (
              <p className="rounded-2xl bg-[#f4dfd9] px-4 py-2.5 text-sm">
                <b>Antes:</b> {day(r.requested.at)}, {time(r.requested.at)} · {party(r.requested.people)}
              </p>
            ) : null}
            <Details rows={rows} />
            {r.shopNote ? (
              <p className="rounded-2xl border border-[#e6dcc8] px-4 py-3 text-sm">
                Nota de {shop.shortName}: {r.shopNote}
              </p>
            ) : null}
            <p className="text-sm">Si el cambio no te sirve, cancelala y reservá otra mesa:</p>
            <Link href={`/reservas/cancelar?ref=${encodeURIComponent(r.ref)}`} className={`${btn} border-2 border-[#b3141f] text-[#b3141f]`}>
              Cancelar mi reserva
            </Link>
          </>
        ) : null}

        {kind === "cancelacion" ? (
          <>
            <h2 className="font-display text-[26px] leading-8">Tu reserva fue cancelada</h2>
            <p>
              {r.cancelledBy === "cliente"
                ? `Hola ${firstName(r.name)}, cancelaste tu reserva. Liberamos la mesa.`
                : `Hola ${firstName(r.name)}, tuvimos que cancelar tu reserva. Perdón por el inconveniente.`}
            </p>
            <Details rows={rows.slice(0, 5)} />
            <MoneyNote cancelled />
            <Link href="/reservas" className={`${btn} bg-[#b3141f] text-white`}>
              Reservar otra mesa
            </Link>
          </>
        ) : null}

        <p className="border-t border-[#e6dcc8] pt-4 text-xs text-[#6a6058]">
          {shop.name} · {shop.address}, {shop.neighborhood}
          <br />
          Consultas por WhatsApp: {shop.phone?.label}
        </p>
      </div>
    </article>
  );
}
