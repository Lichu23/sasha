import type { Metadata } from "next";
import { Agenda } from "@/components/clinica/agenda";

export const metadata: Metadata = { title: "Agenda" };

export default function AgendaPage() {
  return <Agenda />;
}
