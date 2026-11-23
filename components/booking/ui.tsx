import type { Venue } from "@/lib/booking/venues";

// Small pieces both booking demos share: the icons, the venue's mark and the form control styles.

export const control = "w-full rounded-xl bg-paper px-3.5 py-3 text-base ring-1 ring-line outline-none focus:ring-2 focus:ring-brand aria-invalid:ring-brand-ink";
export const primaryButton =
  "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-brand px-5 font-semibold text-white [touch-action:manipulation] transition-[background-color,transform] hover:bg-brand-ink active:scale-[0.98] disabled:opacity-60 motion-reduce:active:scale-100";
export const ghostButton =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-paper px-4 text-sm font-semibold ring-1 ring-line [touch-action:manipulation] transition-[background-color,transform] hover:ring-brand/50 active:scale-[0.97] motion-reduce:active:scale-100";

type IconProps = { className?: string };
const base = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

export const StarIcon = ({ className }: IconProps) => (
  <svg {...base} className={className} fill="currentColor" stroke="none">
    <path d="m12 2.8 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.6l-5.8 3.1 1.1-6.5L2.6 9.6l6.5-.9z" />
  </svg>
);
export const PinIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);
export const ClockIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);
export const CalendarIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
    <path d="M8 3v4M16 3v4M3.5 10h17" />
  </svg>
);
export const CheckIcon = ({ className }: IconProps) => (
  <svg {...base} className={className} strokeWidth={2.4}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);
export const UserIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4.5 20c.8-3.6 3.7-5.5 7.5-5.5s6.7 1.9 7.5 5.5" />
  </svg>
);
export const LockIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <rect x="5" y="10.5" width="14" height="9.5" rx="2.5" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
  </svg>
);
export const ChevronIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="m9 6 6 6-6 6" />
  </svg>
);

/** The venue's mark: a lotus for the studio, a sparkle for the beauty center, a leaf for the nutrition practice. */
export function VenueMark({ venue, size = 28, className }: { venue: Venue; size?: number; className?: string }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round", className, "aria-hidden": true } as const;
  if (venue.slug === "nutricion")
    return (
      <svg {...common}>
        <path d="M5 19c0-7.2 4.4-12.6 14-14 .4 8.6-4.2 14-11.4 14.2" />
        <path d="M5 19c2.2-4.4 5.2-7.6 9-9.6" />
      </svg>
    );
  return venue.slug === "estudio" ? (
    <svg {...common}>
      <path d="M12 4c2.6 2.4 3.6 5.2 3 8.4-.5 2.2-1.7 3.9-3 4.8-1.3-.9-2.5-2.6-3-4.8C8.4 9.2 9.4 6.4 12 4Z" />
      <path d="M4 10.5c3 .1 5.1 1.3 6.2 3.6M20 10.5c-3 .1-5.1 1.3-6.2 3.6M6.5 18.5c2.2 1 4.3 1.3 5.5 1.3s3.3-.3 5.5-1.3" />
    </svg>
  ) : (
    <svg {...common}>
      <path d="M12 3.5 13.8 9l5.7 1.8-5.7 1.8L12 18l-1.8-5.4L4.5 10.8 10.2 9z" />
      <path d="M18.5 3.5v3M17 5h3M5.5 16.5v3M4 18h3" />
    </svg>
  );
}

export function Stars() {
  return (
    <span className="inline-flex gap-0.5 text-amber-500" aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <StarIcon key={i} className="size-3.5" />
      ))}
    </span>
  );
}
