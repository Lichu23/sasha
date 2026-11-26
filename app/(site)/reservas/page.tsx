import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ReservationForm } from "@/components/reservations/reservation-form";
import { confirmsByEmail, reservations, shop } from "@/lib/shop";

export const metadata: Metadata = {
  title: "Reservar una mesa",
  description: `Reservá una mesa en ${shop.name}: elegí el día, el horario y cuántos son.`,
};

// Only shops with `reservations` in shop.ts (and a salón) take table reservations.
export default function ReservationsPage() {
  if (!reservations) notFound();

  return (
    <>
      <header className="mx-auto max-w-xl px-4 pt-10 pb-6 sm:px-6">
        <p className="text-sm font-semibold tracking-wide text-brand uppercase">Mesas del salón</p>
        <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight sm:text-5xl">Reservá tu mesa</h1>
        <p className="mt-3 text-muted text-pretty">
          Elegí el día, el horario y cuántos son.{" "}
          {confirmsByEmail ? "Te confirmamos al instante por email." : `${shop.shortName} te confirma por WhatsApp.`}
        </p>
      </header>
      {/* useSearchParams (the match chosen on the home page) needs a Suspense boundary while prerendering. */}
      <Suspense fallback={null}>
        <ReservationForm />
      </Suspense>
    </>
  );
}
