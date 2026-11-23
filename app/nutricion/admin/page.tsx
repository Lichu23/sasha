import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminBoard } from "@/components/booking/admin-board";
import { nutricion } from "@/lib/booking/venues";

export const metadata: Metadata = { title: "Agenda" };

export default function NutricionAdminPage() {
  return (
    // useSearchParams (the booking just made, ?nuevo=) needs a Suspense boundary.
    <Suspense fallback={<p className="px-5 py-10 text-center text-muted">Cargando la agenda…</p>}>
      <AdminBoard venue={nutricion} />
    </Suspense>
  );
}
