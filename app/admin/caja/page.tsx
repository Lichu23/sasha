import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Pos } from "@/components/admin/pos";
import { management } from "@/lib/shop";

export const metadata: Metadata = { title: "Caja" };

// Only shops in management mode have the Caja.
export default function PosPage() {
  if (!management) notFound();
  return <Pos />;
}
