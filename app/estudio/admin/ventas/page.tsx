import type { Metadata } from "next";
import { SalesBoard } from "@/components/booking/sales-board";
import { estudio } from "@/lib/booking/venues";

export const metadata: Metadata = { title: "Ventas" };

export default function EstudioSalesPage() {
  return <SalesBoard venue={estudio} />;
}
