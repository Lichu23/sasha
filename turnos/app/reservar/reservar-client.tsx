"use client";

import { useRouter } from "next/navigation";
import { BookingFlow } from "@/components/booking/booking-flow";

export function ReservarClient() {
  const router = useRouter();
  return <BookingFlow source="web" onBooked={(a) => router.push(`/turno/${a.id}`)} />;
}
