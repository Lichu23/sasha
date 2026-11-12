import { clinic } from "@/lib/clinic";

/** Floating WhatsApp button, thumb-reachable on phones and clear of the home indicator. */
export function WhatsappFab() {
  return (
    <a
      href={`https://wa.me/${clinic.whatsapp}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribir por WhatsApp"
      className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 flex size-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-lg ring-1 ring-black/10 transition-transform active:scale-95 motion-reduce:transition-none"
    >
      <svg viewBox="0 0 24 24" className="size-7" fill="currentColor" aria-hidden="true">
        <path d="M12.04 2a9.9 9.9 0 0 0-8.5 14.96L2 22l5.2-1.5A9.95 9.95 0 1 0 12.04 2Zm5.8 14.06c-.25.7-1.45 1.34-2 1.4-.52.06-1.18.09-1.9-.12a15.7 15.7 0 0 1-1.72-.64c-3.03-1.31-5-4.37-5.15-4.57-.15-.2-1.23-1.64-1.23-3.12 0-1.49.78-2.22 1.06-2.52.27-.3.6-.38.8-.38h.57c.18 0 .43-.07.67.51.25.6.85 2.08.92 2.23.07.15.12.33.02.52-.1.2-.15.32-.3.5-.15.17-.31.38-.44.51-.15.15-.3.31-.13.6.17.3.78 1.28 1.67 2.07 1.15 1.02 2.12 1.34 2.42 1.49.3.15.47.12.65-.07.17-.2.75-.87.95-1.17.2-.3.4-.25.67-.15.27.1 1.73.82 2.03.97.3.15.5.22.57.35.07.12.07.72-.18 1.42Z" />
      </svg>
    </a>
  );
}
