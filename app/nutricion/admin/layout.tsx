import { AdminHeader } from "@/components/booking/admin-header";
import { nutricion } from "@/lib/booking/venues";

// The practice's panel: its own header and views (Agenda, Pacientes, Ventas), apart from the customer's page.
export default function NutricionAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminHeader venue={nutricion} />
      {children}
    </>
  );
}
