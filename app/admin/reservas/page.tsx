import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ReservationsBoard, ReservationsBoardFromUrl } from "@/components/admin/reservations-board";
import { PageTransition } from "@/components/page-transition";
import { reservations } from "@/lib/shop";

export const metadata: Metadata = { title: "Reservas" };

// Only shops with `reservations` in shop.ts take table reservations.
export default function AdminReservationsPage() {
  if (!reservations) notFound();

  return (
    <PageTransition>
      <div>
        {/* useSearchParams only suspends while prerendering; on in-app navigation the real board renders at once. */}
        <Suspense fallback={<ReservationsBoard highlight={null} />}>
          <ReservationsBoardFromUrl />
        </Suspense>
      </div>
    </PageTransition>
  );
}
