import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ReservationDone } from "@/components/reservations/reservation-done";
import { confirmsByEmail } from "@/lib/shop";

export const metadata: Metadata = { title: "Mesa reservada" };

export default function ReservationDonePage() {
  if (!confirmsByEmail) notFound();
  return (
    <Suspense fallback={<p className="px-4 py-16 text-center text-muted">Confirmando tu reserva…</p>}>
      <ReservationDone />
    </Suspense>
  );
}
