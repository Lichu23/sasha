import type { Metadata } from "next";
import { Suspense } from "react";
import { EmailView } from "@/components/booking/booking-lookup";
import { VenueFooter, VenueHeader } from "@/components/booking/venue-shell";
import { nutricion } from "@/lib/booking/venues";

export const metadata: Metadata = { title: "Tu email de confirmación" };

// The confirmation email a patient receives after booking (an example: nothing is sent).
export default function NutricionEmailPage() {
  return (
    <>
      <VenueHeader venue={nutricion} onBookingPage />
      <main className="flex flex-1 flex-col">
        <Suspense fallback={<p className="px-5 py-10 text-center text-muted">Abriendo el email…</p>}>
          <EmailView venue={nutricion} />
        </Suspense>
      </main>
      <VenueFooter venue={nutricion} />
    </>
  );
}
