import { ClassesBooking } from "@/components/booking/classes-booking";
import { VenueFooter, VenueHeader, VenueHero } from "@/components/booking/venue-shell";
import { estudio } from "@/lib/booking/venues";

export default function EstudioPage() {
  return (
    <>
      <VenueHeader venue={estudio} current="cliente" />
      <main className="flex flex-1 flex-col">
        <VenueHero venue={estudio} />
        <ClassesBooking venue={estudio} />
      </main>
      <VenueFooter venue={estudio} />
    </>
  );
}
