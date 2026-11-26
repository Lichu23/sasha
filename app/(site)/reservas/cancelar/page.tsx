import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CancelReservation } from "@/components/reservations/reservation-done";
import { confirmsByEmail } from "@/lib/shop";

export const metadata: Metadata = { title: "Cancelar reserva" };

// The page the cancel button of the confirmation email opens.
export default function CancelReservationPage() {
  if (!confirmsByEmail) notFound();
  return (
    <Suspense fallback={<p className="px-4 py-16 text-center text-muted">Buscando tu reserva…</p>}>
      <CancelReservation />
    </Suspense>
  );
}
