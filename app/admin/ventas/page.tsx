import type { Metadata } from "next";
import { ManagementSummary } from "@/components/admin/management-summary";
import { SalesDashboard } from "@/components/admin/sales-dashboard";
import { PageTransition } from "@/components/page-transition";
import { management } from "@/lib/shop";

export const metadata: Metadata = { title: "Ventas" };

export default function AdminSalesPage() {
  return (
    <PageTransition>
      <div>{management ? <ManagementSummary /> : <SalesDashboard />}</div>
    </PageTransition>
  );
}
