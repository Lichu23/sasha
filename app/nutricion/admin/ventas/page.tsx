import type { Metadata } from "next";
import { SalesBoard } from "@/components/booking/sales-board";
import { nutricion } from "@/lib/booking/venues";

export const metadata: Metadata = { title: "Ventas" };

export default function NutricionSalesPage() {
  return <SalesBoard venue={nutricion} />;
}
