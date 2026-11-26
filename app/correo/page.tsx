import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MailView } from "@/components/mail/mail-view";
import { confirmsByEmail } from "@/lib/shop";

export const metadata: Metadata = { title: "Tu email de la reserva" };

// The email a reservation sends, in a phone mail app (an example: nothing is sent). Only for shops that confirm by email.
export default function MailPage() {
  if (!confirmsByEmail) notFound();
  return (
    <Suspense fallback={<p className="px-5 py-10 text-center text-muted">Abriendo el mail…</p>}>
      <MailView />
    </Suspense>
  );
}
