"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckIcon, WhatsappIcon } from "@/components/icons";
import { capitalize } from "@/lib/admin-dates";
import { formatPickup } from "@/lib/pickup";
import { cancelDeadline, cancelHours, reservationActions, useReservation, type Reservation } from "@/lib/reservations";
import { greeting, REFERENCE, shop, whatsappLink } from "@/lib/shop";
import { useNow } from "@/lib/use-now";

// The two pages after the form, for shops that confirm by email: "¡Mesa reservada!" (with the button that opens the
// simulated email) and the page the cancel link of that email opens. Demo: see lib/reservations.ts.

const people = (n: number) => `${n} ${n === 1 ? "persona" : "personas"}`;
const card = "mx-auto w-full max-w-xl px-4 sm:px-6";
const primary = "flex min-h-12 w-full items-center justify-center rounded-full bg-brand px-5 py-3.5 font-semibold text-white transition-[background-color,transform] [touch-action:manipulation] hover:bg-brand-ink active:scale-[0.98]";
const secondary = "flex min-h-12 w-full items-center justify-center rounded-full bg-paper px-5 py-3.5 font-semibold ring-1 ring-line [touch-action:manipulation] hover:bg-blush active:scale-[0.98]";

function useRef() {
  const raw = useSearchParams().get("ref");
  const ref = raw && REFERENCE.test(raw) ? raw : null;
  return { ref, r: useReservation(ref), now: useNow() };
}

function Missing() {
  return (
    <div className={`${card} py-16 text-center`}>
      <p className="font-semibold">No encontramos esa reserva.</p>
      <p className="mt-1 text-muted">Puede que se haya hecho desde otro navegador.</p>
      <Link href="/reservas" className="mt-5 inline-block font-semibold text-brand-ink">
        Reservar una mesa
      </Link>
    </div>
  );
}

function Summary({ r }: { r: Reservation }) {
  const rows: [string, string][] = [
    ["Cuándo", capitalize(formatPickup(r.at))],
    ["Personas", people(r.people)],
    ["A nombre de", r.name],
    ["Reserva", r.ref],
  ];
  if (r.notes) rows.push(["Comentarios", r.notes]);
  return (
    <dl className="divide-y divide-line rounded-2xl bg-paper px-4 ring-1 ring-line">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-baseline justify-between gap-4 py-3">
          <dt className="text-sm text-muted">{label}</dt>
          <dd className="text-right text-sm font-semibold">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** /reservas/listo?ref=...: the reservation is confirmed; the email is one tap away. */
export function ReservationDone() {
  const { r } = useRef();
  if (r === null) return <p className={`${card} py-16 text-center text-muted`}>Confirmando tu reserva…</p>;
  if (!r) return <Missing />;

  return (
    <div className={`${card} pt-10 pb-14`}>
      <span className="grid size-14 place-items-center rounded-full bg-emerald-100 text-emerald-700">
        <CheckIcon width={28} height={28} />
      </span>
      <h1 className="mt-4 font-display text-4xl tracking-tight sm:text-5xl">¡Mesa reservada!</h1>
      <p className="mt-3 text-muted text-pretty">
        Te esperamos en {shop.name}, {shop.address}. Tu mesa queda confirmada y no se cobra nada.
      </p>

      <div className="mt-6">
        <Summary r={r} />
      </div>

      <div className="mt-6 rounded-2xl bg-blush p-4">
        <p className="font-semibold text-brand-ink">Te mandamos un email</p>
        <p className="mt-1 text-sm text-ink/80">
          A <b className="break-all">{r.email}</b>, con los datos de tu reserva y el botón para cancelar si no podés venir.
        </p>
        <Link href={`/correo?ref=${r.ref}`} data-cta="abrir-mail" className={`${primary} mt-4`}>
          Abrir mi mail
        </Link>
      </div>

      <Link href="/" className={`${secondary} mt-3`}>
        Volver al inicio
      </Link>
    </div>
  );
}

/** /reservas/cancelar?ref=...: the page the cancel button of the email opens. */
export function CancelReservation() {
  const { r, now } = useRef();
  if (r === null || now === null) return <p className={`${card} py-16 text-center text-muted`}>Buscando tu reserva…</p>;
  if (!r) return <Missing />;

  const cancelled = r.status === "cancelada";
  const inTime = now <= cancelDeadline(r);
  const closed = !cancelled && r.status !== "confirmada";

  return (
    <div className={`${card} pt-10 pb-14`}>
      <h1 className="font-display text-4xl tracking-tight sm:text-5xl">{cancelled ? "Reserva cancelada" : "Cancelar mi reserva"}</h1>

      {cancelled ? (
        <>
          <p className="mt-3 text-muted text-pretty">
            Listo, liberamos tu mesa. No se te había cobrado nada, así que no hay nada para reintegrar. Te mandamos un email con la cancelación.
          </p>
          <div className="mt-6">
            <Summary r={r} />
          </div>
          <div className="mt-6 grid gap-3">
            <Link href={`/correo?ref=${r.ref}&tipo=cancelacion`} data-cta="abrir-mail-cancelacion" className={primary}>
              Abrir el email de la cancelación
            </Link>
            <Link href="/reservas" className={secondary}>
              Reservar otra mesa
            </Link>
          </div>
        </>
      ) : closed ? (
        <p className="mt-3 text-muted">Esta reserva ya no se puede cancelar desde acá.</p>
      ) : (
        <>
          <p className="mt-3 text-muted text-pretty">
            {inTime
              ? "Si cancelás, liberamos tu mesa. Esta reserva no tiene seña: no se te cobró nada, así que no hay nada para reintegrar."
              : `Ya pasó el plazo para cancelar desde acá (hasta ${cancelHours} horas antes). Avisanos por WhatsApp y vemos qué se puede hacer.`}
          </p>
          <div className="mt-6">
            <Summary r={r} />
          </div>
          <div className="mt-6 grid gap-3">
            {inTime ? (
              <button
                type="button"
                onClick={() => reservationActions.cancelByCustomer(r.ref)}
                data-cta="confirmar-cancelacion"
                className="flex min-h-12 w-full items-center justify-center rounded-full bg-brand-ink px-5 py-3.5 font-semibold text-white [touch-action:manipulation] active:scale-[0.98]"
              >
                Sí, cancelar mi reserva
              </button>
            ) : (
              <a href={whatsappLink(`${greeting} Quiero cancelar mi reserva ${r.ref}.`)} target="_blank" rel="noreferrer" className={primary}>
                <WhatsappIcon className="mr-2" /> Escribir por WhatsApp
              </a>
            )}
            <Link href="/" className={secondary}>
              No, mantener mi reserva
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
