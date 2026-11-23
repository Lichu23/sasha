import type { Metadata } from "next";
import { PatientsBoard } from "@/components/booking/patients-board";
import { nutricion } from "@/lib/booking/venues";

export const metadata: Metadata = { title: "Pacientes" };

export default function NutricionPatientsPage() {
  return <PatientsBoard venue={nutricion} />;
}
