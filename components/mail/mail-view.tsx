"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { GmailMobile } from "@/components/mail/gmail-mobile";
import { mailSentLabel, mailSubject, ReservationMail, type MailKind } from "@/components/mail/reservation-mail";
import { useReservation } from "@/lib/reservations";
import { REFERENCE, shop } from "@/lib/shop";
import { useNow } from "@/lib/use-now";

const KINDS: readonly MailKind[] = ["confirmacion", "modificacion", "cancelacion"];

/** /correo?ref=...&tipo=confirmacion|modificacion|cancelacion: the email of a reservation in a Gmail-like phone screen. */
export function MailView() {
  const params = useSearchParams();
  const rawRef = params.get("ref");
  const ref = rawRef && REFERENCE.test(rawRef) ? rawRef : null;
  const kind = KINDS.find((k) => k === params.get("tipo")) ?? "confirmacion";
  const r = useReservation(ref);
  const now = useNow();

  if (r === null || now === null) return <p className="px-5 py-10 text-center text-muted">Abriendo el mail…</p>;
  if (!r) {
    return (
      <div className="mx-auto max-w-sm px-5 py-16 text-center">
        <p className="font-semibold">No encontramos ese mail.</p>
        <p className="mt-1 text-muted">Puede que la reserva se haya hecho desde otro navegador.</p>
        <Link href="/reservas" className="mt-5 inline-block font-semibold text-brand-ink">
          Reservar una mesa
        </Link>
      </div>
    );
  }

  return (
    <GmailMobile
      backHref={kind === "confirmacion" ? `/reservas/listo?ref=${r.ref}` : "/admin/reservas"}
      subject={mailSubject(kind)}
      sender={shop.name}
      logo={shop.logo}
      sentLabel={mailSentLabel(r, kind, now)}
    >
      <ReservationMail r={r} kind={kind} />
    </GmailMobile>
  );
}
