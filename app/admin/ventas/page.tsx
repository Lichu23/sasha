import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ManagementSummary } from "@/components/admin/management-summary";
import { SalesDashboard } from "@/components/admin/sales-dashboard";
import { PageTransition } from "@/components/page-transition";
import { management, takesOrders } from "@/lib/shop";

export const metadata: Metadata = { title: "Ventas" };

export default function AdminSalesPage() {
  if (!takesOrders) notFound();
  return (
    <PageTransition>
      <div>{management ? <ManagementSummary /> : <SalesDashboard />}</div>
    </PageTransition>
  );
}
