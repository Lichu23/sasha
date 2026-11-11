import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DaySales } from "@/components/admin/day-sales";
import { PageTransition } from "@/components/page-transition";
import { management } from "@/lib/shop";

export const metadata: Metadata = { title: "Ventas" };

// Only shops in management mode have the day's sales.
export default function DaySalesPage() {
  if (!management) notFound();

  return (
    <PageTransition>
      <div>
        <DaySales />
      </div>
    </PageTransition>
  );
}
