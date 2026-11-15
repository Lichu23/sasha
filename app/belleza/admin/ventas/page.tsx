import type { Metadata } from "next";
import { SalesBoard } from "@/components/booking/sales-board";
import { belleza } from "@/lib/booking/venues";

export const metadata: Metadata = { title: "Ventas" };

export default function BellezaSalesPage() {
  return <SalesBoard venue={belleza} />;
}
