import { AdminHeader } from "@/components/booking/admin-header";
import { estudio } from "@/lib/booking/venues";

// The business's panel: its own header and views (Reservas, Ventas), apart from the customer's page.
export default function EstudioAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminHeader venue={estudio} />
      {children}
    </>
  );
}
