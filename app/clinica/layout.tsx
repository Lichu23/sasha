import type { Metadata, Viewport } from "next";
import { clinic } from "@/lib/clinica";
import "./clinica.css";

export const metadata: Metadata = {
  title: { default: `${clinic.name} · Asistente de turnos`, template: `%s · ${clinic.name}` },
  description: `Demo: un asistente de turnos por WhatsApp para ${clinic.name} y el panel de la clínica.`,
};

export const viewport: Viewport = {
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: clinic.theme.cream,
};

// The clinic's colors replace the shop's inside this section (the shop's tokens read these variables).
const theme = Object.fromEntries(Object.entries(clinic.theme).map(([name, value]) => [`--${name}`, value])) as React.CSSProperties;

export default function ClinicaLayout({ children }: LayoutProps<"/clinica">) {
  return (
    <div
      data-clinica
      style={{ ...theme, fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
      className="flex flex-1 flex-col overscroll-none bg-cream text-ink"
    >
      {children}
    </div>
  );
}
