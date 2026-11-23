import type { Metadata } from "next";
import { ServicesBooking } from "@/components/booking/services-booking";
import { VenueFooter, VenueHeader } from "@/components/booking/venue-shell";
import { nutricion } from "@/lib/booking/venues";

export const metadata: Metadata = { title: "Reservar turno" };

// The booking on its own page: consultation, how (in person or online), day, time and the deposit.
export default function NutricionReservarPage() {
  return (
    <>
      <VenueHeader venue={nutricion} onBookingPage />
      <main className="flex flex-1 flex-col">
        <ServicesBooking venue={nutricion} />
      </main>
      <VenueFooter venue={nutricion} />
    </>
  );
}
