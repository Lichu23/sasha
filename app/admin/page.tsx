import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { OrdersBoard, OrdersBoardFromUrl } from "@/components/admin/orders-board";
import { PageTransition } from "@/components/page-transition";
import { management } from "@/lib/shop";

export const metadata: Metadata = { title: "Pedidos" };

export default function AdminOrdersPage() {
  // Management shops have no online orders: the panel opens on the Caja.
  if (management) redirect("/admin/caja");

  return (
    <PageTransition>
      <div>
        {/* useSearchParams only suspends while prerendering; on in-app navigation the real
            board renders immediately, so the view transition can morph the new order's card. */}
        <Suspense fallback={<OrdersBoard highlight={null} />}>
          <OrdersBoardFromUrl />
        </Suspense>
      </div>
    </PageTransition>
  );
}
