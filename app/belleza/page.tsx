import { VenueFooter, VenueHeader, VenueHero } from "@/components/booking/venue-shell";
import { VenueCta, VenueGallery, VenueInfo, VenueReviews } from "@/components/booking/venue-sections";
import { belleza } from "@/lib/booking/venues";

// The center's home: who they are and what they do. The booking is its own page, /belleza/reservar.
export default function BellezaPage() {
  return (
    <>
      <VenueHeader venue={belleza} />
      <main className="flex flex-1 flex-col">
        <VenueHero venue={belleza} />
        <VenueGallery venue={belleza} />
        <VenueReviews venue={belleza} />
        <VenueInfo venue={belleza} />
        <VenueCta venue={belleza} />
      </main>
      <VenueFooter venue={belleza} />
    </>
  );
}
