import type { ClinicConfig } from "@/lib/types";

const days = (windows: [string, string][], list: number[]) =>
  Object.fromEntries(list.map((d) => [d, windows]));

// Same engine, different business: shows that only this file changes between verticals.
export const barberiaNorte: ClinicConfig = {
  slug: "barberia-norte",
  name: "Barbería Norte",
  kind: "Barbería",
  tagline: "Cortes con turno, sin esperar",
  description: "Elegí tu barbero, el día y la hora. Te llega la confirmación al instante.",
  address: "Calle Falsa 742",
  city: "Rosario",
  whatsapp: "5493410000000",
  phone: "+54 341 000-0000",
  hours: [
    { label: "Martes a sábado", value: "10:00 a 20:00" },
    { label: "Domingo y lunes", value: "Cerrado" },
  ],
  theme: { brand: "#b45309", brandInk: "#7c3a06", soft: "#fdf0e0", ink: "#1f1a14" },
  slotStepMinutes: 15,
  bookingWindowDays: 14,
  leadMinutes: 60,
  cancelUntilHours: 2,
  coverages: [],
  clientWord: "cliente",
  services: [
    { id: "corte", name: "Corte", description: "Corte a elección, lavado incluido.", minutes: 30, priceFrom: 9000 },
    { id: "barba", name: "Barba", description: "Perfilado y toalla caliente.", minutes: 30, priceFrom: 7000 },
    { id: "combo", name: "Corte + barba", description: "El combo completo.", minutes: 60, priceFrom: 15000 },
  ],
  professionals: [
    {
      id: "nico",
      name: "Nico",
      role: "Barbero",
      serviceIds: ["corte", "barba", "combo"],
      schedule: days([["10:00", "13:00"], ["15:00", "20:00"]], [2, 3, 4, 5, 6]),
    },
    {
      id: "fede",
      name: "Fede",
      role: "Barbero",
      serviceIds: ["corte", "barba", "combo"],
      schedule: days([["12:00", "20:00"]], [3, 4, 5, 6]),
    },
  ],
};
