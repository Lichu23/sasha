import type { Metadata } from "next";
import { ServicesBooking } from "@/components/booking/services-booking";
import { VenueFooter, VenueHeader } from "@/components/booking/venue-shell";
import { belleza } from "@/lib/booking/venues";

export const metadata: Metadata = { title: "Reservar cita" };

// The booking on its own page: treatment, professional, day, time, and the payment.
export default function BellezaReservarPage() {
  return (
    <>
      <VenueHeader venue={belleza} onBookingPage />
      <main className="flex flex-1 flex-col">
        <ServicesBooking venue={belleza} />
      </main>
      <VenueFooter venue={belleza} />
    </>
  );
}
