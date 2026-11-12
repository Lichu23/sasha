import { auroraDental } from "@/clinics/aurora-dental/clinic";
import { barberiaNorte } from "@/clinics/barberia-norte/clinic";
import type { ClinicConfig } from "./types";

const registry: Record<string, ClinicConfig> = {
  [auroraDental.slug]: auroraDental,
  [barberiaNorte.slug]: barberiaNorte,
};

/** Pick the business with `CLINIC=<slug>`; the dental clinic is the default demo. */
export const clinic: ClinicConfig = registry[process.env.CLINIC ?? ""] ?? auroraDental;

export const serviceById = (id: string) => clinic.services.find((s) => s.id === id);
export const professionalById = (id: string) => clinic.professionals.find((p) => p.id === id);
