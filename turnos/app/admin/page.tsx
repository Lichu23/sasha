import type { Metadata } from "next";
import { AdminAgenda } from "@/components/admin/admin-agenda";

export const metadata: Metadata = { title: "Panel" };

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <AdminAgenda />
    </div>
  );
}
