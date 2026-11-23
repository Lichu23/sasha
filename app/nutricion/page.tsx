import { VenueFooter, VenueHeader, VenueHero } from "@/components/booking/venue-shell";
import { VenueAbout, VenueCta, VenueFaq, VenueInfo, VenueReviews, VenueServices, VenueSteps, VenueTips } from "@/components/booking/venue-sections";
import { nutricion } from "@/lib/booking/venues";

// The practice's home: who they are, the consultations and how it works. The booking is its own page, /nutricion/reservar.
export default function NutricionPage() {
  return (
    <>
      <VenueHeader venue={nutricion} />
      <main className="flex flex-1 flex-col">
        <VenueHero venue={nutricion} />
        <VenueServices venue={nutricion} />
        <VenueSteps venue={nutricion} />
        <VenueAbout venue={nutricion} />
        <VenueReviews venue={nutricion} />
        <VenueTips venue={nutricion} />
        <VenueFaq venue={nutricion} />
        <VenueInfo venue={nutricion} />
        <VenueCta venue={nutricion} />
      </main>
      <VenueFooter venue={nutricion} />
    </>
  );
}
