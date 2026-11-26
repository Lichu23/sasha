import Image from "next/image";
import Link from "next/link";

// A mail app on a phone, drawn like Gmail: the top bar with its icons, the subject, the sender row and the message.
// It is an example: nothing is sent. Colors and shapes follow Gmail on Android; the message goes inside as children.

const ink = "#1f1f1f";
const grey = "#5f6368";

function Svg({ children, size = 24, className }: { children: React.ReactNode; size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true" className={className}>
      {children}
    </svg>
  );
}

const Back = () => (
  <Svg>
    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
  </Svg>
);
const Archive = () => (
  <Svg>
    <path d="M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z" />
  </Svg>
);
const Delete = () => (
  <Svg>
    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
  </Svg>
);
const Mail = () => (
  <Svg>
    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z" />
  </Svg>
);
const More = () => (
  <Svg>
    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
  </Svg>
);
const Star = () => (
  <Svg>
    <path d="M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z" />
  </Svg>
);
const Reply = () => (
  <Svg>
    <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z" />
  </Svg>
);
const ReplyOutline = () => (
  <Svg size={18}>
    <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11zm-2 2.5l-2.6 2.5L8 16.5v-2.3c3.4-.2 6.3.7 8.8 2.6-1.3-3.2-4.4-5.1-8.8-5.3z" />
  </Svg>
);
const Forward = () => (
  <Svg size={18}>
    <path d="M12 8V4l8 8-8 8v-4c-4.4 0-7.5 1.4-10 4 1-5 4-9.5 10-10zm2 2.8c-3 .2-5.4 1.5-7.2 3.7 2-1 4.2-1.5 7.2-1.5V16l4.2-4-4.2-4v2.8z" />
  </Svg>
);
const Expand = () => (
  <Svg size={16}>
    <path d="M7 10l5 5 5-5z" />
  </Svg>
);

export function GmailMobile({
  backHref,
  subject,
  sender,
  logo,
  sentLabel,
  children,
}: {
  backHref: string;
  subject: string;
  sender: string;
  logo?: string;
  sentLabel: string;
  children: React.ReactNode;
}) {
  const iconButton = "grid size-12 place-items-center rounded-full [touch-action:manipulation] active:bg-black/10";
  return (
    <div
      className="mx-auto flex min-h-dvh w-full max-w-[28rem] flex-col bg-white text-[#1f1f1f]"
      style={{ fontFamily: '"Google Sans", "Google Sans Text", Roboto, "Helvetica Neue", Arial, sans-serif', color: ink }}
    >
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between bg-white px-1" style={{ color: grey }}>
        <Link href={backHref} aria-label="Volver" className={iconButton}>
          <Back />
        </Link>
        <div className="flex items-center">
          <span className={iconButton} aria-label="Archivar">
            <Archive />
          </span>
          <span className={iconButton} aria-label="Eliminar">
            <Delete />
          </span>
          <span className={iconButton} aria-label="Marcar como no leído">
            <Mail />
          </span>
          <span className={iconButton} aria-label="Más opciones">
            <More />
          </span>
        </div>
      </header>

      <div className="px-4 pt-1 pb-3">
        <h1 className="text-[22px] leading-7 font-normal">
          {subject}
          <span className="ml-2 inline-flex translate-y-[-2px] items-center rounded-[4px] bg-[#ddd] px-1.5 py-px text-[11px] leading-4 font-medium text-[#444]">Recibidos</span>
        </h1>
      </div>

      <div className="flex items-start gap-3 px-4 pb-3">
        {logo ? (
          <Image src={logo} alt="" width={40} height={40} className="mt-0.5 size-10 rounded-full" />
        ) : (
          <span className="mt-0.5 grid size-10 place-items-center rounded-full bg-[#b3141f] font-semibold text-white">{sender.charAt(0)}</span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate text-[15px] font-medium">{sender}</p>
            <p className="shrink-0 text-xs" style={{ color: grey }}>
              {sentLabel}
            </p>
          </div>
          <p className="flex items-center gap-0.5 text-[13px]" style={{ color: grey }}>
            para mí <Expand />
          </p>
        </div>
        <div className="-mr-2 flex shrink-0 items-center" style={{ color: grey }}>
          <span className="grid size-9 place-items-center" aria-hidden>
            <Star />
          </span>
          <span className="grid size-9 place-items-center" aria-hidden>
            <Reply />
          </span>
          <span className="grid size-9 place-items-center" aria-hidden>
            <More />
          </span>
        </div>
      </div>

      <main className="flex-1 pb-6">{children}</main>

      <footer className="flex gap-3 px-4 pt-2 pb-6">
        {[
          { label: "Responder", icon: <ReplyOutline /> },
          { label: "Reenviar", icon: <Forward /> },
        ].map((b) => (
          <span key={b.label} className="flex h-10 flex-1 items-center justify-center gap-2 rounded-full border border-[#747775] text-sm font-medium" style={{ color: "#444746" }}>
            {b.icon} {b.label}
          </span>
        ))}
      </footer>
    </div>
  );
}
