import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminBoard } from "@/components/booking/admin-board";
import { VenueHeader } from "@/components/booking/venue-shell";
import { estudio } from "@/lib/booking/venues";

export const metadata: Metadata = { title: "Panel" };

export default function EstudioAdminPage() {
  return (
    <>
      <VenueHeader venue={estudio} current="panel" />
      {/* useSearchParams (the booking just made, ?nuevo=) needs a Suspense boundary. */}
      <Suspense fallback={<p className="px-5 py-10 text-center text-muted">Cargando la agenda…</p>}>
        <AdminBoard venue={estudio} />
      </Suspense>
    </>
  );
}
