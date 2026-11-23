import type { Metadata } from "next";
import { Suspense } from "react";
import { CancelView } from "@/components/booking/booking-lookup";
import { VenueFooter, VenueHeader } from "@/components/booking/venue-shell";
import { nutricion } from "@/lib/booking/venues";

export const metadata: Metadata = { title: "Cancelar turno" };

// The page the cancel link of the confirmation email opens.
export default function NutricionCancelarPage() {
  return (
    <>
      <VenueHeader venue={nutricion} onBookingPage />
      <main className="flex flex-1 flex-col">
        <Suspense fallback={<p className="px-5 py-10 text-center text-muted">Buscando tu turno…</p>}>
          <CancelView venue={nutricion} />
        </Suspense>
      </main>
      <VenueFooter venue={nutricion} />
    </>
  );
}
