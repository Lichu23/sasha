import type { Metadata } from "next";
import { ReservarClient } from "./reservar-client";

export const metadata: Metadata = { title: "Reservar turno" };

export default function ReservarPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-5 text-3xl font-semibold tracking-tight">Reservá tu turno</h1>
      <ReservarClient />
    </div>
  );
}
