import { ServicesBooking } from "@/components/booking/services-booking";
import { VenueFooter, VenueHeader, VenueHero } from "@/components/booking/venue-shell";
import { belleza } from "@/lib/booking/venues";

export default function BellezaPage() {
  return (
    <>
      <VenueHeader venue={belleza} current="cliente" />
      <main className="flex flex-1 flex-col">
        <VenueHero venue={belleza} />
        <ServicesBooking venue={belleza} />
      </main>
      <VenueFooter venue={belleza} />
    </>
  );
}
