import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminBoard } from "@/components/booking/admin-board";
import { belleza } from "@/lib/booking/venues";

export const metadata: Metadata = { title: "Reservas" };

export default function BellezaAdminPage() {
  return (
    // useSearchParams (the booking just made, ?nuevo=) needs a Suspense boundary.
    <Suspense fallback={<p className="px-5 py-10 text-center text-muted">Cargando la agenda…</p>}>
      <AdminBoard venue={belleza} />
    </Suspense>
  );
}
