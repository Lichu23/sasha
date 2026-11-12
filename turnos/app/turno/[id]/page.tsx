import type { Metadata } from "next";
import { AppointmentView } from "@/components/appointment-view";

export const metadata: Metadata = { title: "Tu turno" };

export default async function AppointmentPage({ params }: PageProps<"/turno/[id]">) {
  const { id } = await params;
  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <AppointmentView id={id} />
    </div>
  );
}
