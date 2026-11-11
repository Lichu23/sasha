"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatTime } from "@/lib/admin-dates";
import { orderActions, useOrders, type ChatMessage } from "@/lib/orders";
import { reservationActions, useReservations } from "@/lib/reservations";
import { shop } from "@/lib/shop";

// The demo's WhatsApp: the chat of a consulta (an order, lib/orders.ts) or of a table reservation
// (lib/reservations.ts), between the customer and the shop, kept with it. The customer sees it right after
// "Consultar" or "Reservar"; the shop opens it from /admin. Nothing is sent anywhere. To keep the demo moving, the
// other side answers by itself: the shop acknowledges the consulta, and the customer agrees to whatever the shop writes.

type View = "cliente" | "local";
type Actions = { addMessage: (ref: string, message: ChatMessage) => void; setDraft: (ref: string, draft?: string) => void };

const REPLY_AFTER_MS = 1600;
const post = (actions: Actions, ref: string, message: Omit<ChatMessage, "at">) => actions.addMessage(ref, { ...message, at: Date.now() });

function DoubleCheck() {
  return (
    <svg viewBox="0 0 18 11" width="16" height="10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m1 6 3 3 6.5-7.5M7 8.5l1 .5L14.5 1.5" />
    </svg>
  );
}

export function SimulatedWhatsapp({ reference, view }: { reference: string | null; view: View }) {
  const router = useRouter();
  // The thread is an order or a reservation (the reference says which one exists).
  const order = useOrders()?.find((o) => o.ref === reference);
  const reservation = useReservations()?.find((r) => r.ref === reference);
  const thread = order ?? reservation;
  const actions: Actions = order ? orderActions : reservationActions;
  const confirmed = order ? order.status === "confirmado" : reservation?.status === "confirmada";
  const subject = order ? "consulta" : "reserva";
  const [draft, setDraft] = useState("");
  const [takenDraft, setTakenDraft] = useState<string | undefined>();
  const [replying, setReplying] = useState(false);
  const list = useRef<HTMLDivElement>(null);

  const mine: ChatMessage["from"] = view;
  const messages = thread?.messages ?? [];
  const firstName = thread?.name.split(" ")[0] ?? "";
  const contact = view === "cliente" ? shop.name : (thread?.name ?? "Cliente");

  // The shop's chat can open with a message already written (the confirmation): it goes into the box, and is cleared
  // from the order so it isn't kept twice. It is read whenever it arrives, not only on mount: going back to the panel
  // and returning to the same chat URL reuses this page, with its state, instead of mounting it again.
  const pendingDraft = thread?.draft;
  if (pendingDraft && pendingDraft !== takenDraft) {
    setTakenDraft(pendingDraft);
    setDraft(pendingDraft);
  } else if (!pendingDraft && takenDraft) {
    setTakenDraft(undefined);
  }
  useEffect(() => {
    if (pendingDraft && reference) actions.setDraft(reference, undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `actions` is one of two module objects, chosen by what the reference is
  }, [pendingDraft, reference]);

  // The customer's view: the shop acknowledges the consulta a moment after it arrives.
  const waitingForShop = view === "cliente" && thread !== undefined && messages.length === 1 && messages[0].from === "cliente";
  const typing = waitingForShop || replying;
  useEffect(() => {
    if (!waitingForShop || !reference) return;
    const timer = setTimeout(() => {
      post(actions, reference, { from: "local", text: `¡Hola ${firstName}! Recibimos tu ${subject}. Enseguida la revisamos y te confirmamos 🙌` });
    }, REPLY_AFTER_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `actions` is one of two module objects, chosen by what the reference is
  }, [waitingForShop, reference, firstName, subject]);

  // Keep the last message in view.
  useEffect(() => {
    const el = list.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ top: el.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [messages.length, typing]);

  function send() {
    const text = draft.trim();
    if (!text || !reference) return;
    post(actions, reference, { from: mine, text });
    setDraft("");
    if (view === "local") {
      // The customer agrees (demo). The answer fits what the shop just wrote.
      setReplying(true);
      setTimeout(() => {
        setReplying(false);
        post(actions, reference, { from: "cliente", text: confirmed ? "¡Genial, gracias! Nos vemos 🙌" : "¡Dale, me parece perfecto! 🙌" });
      }, REPLY_AFTER_MS);
    }
  }

  return (
    <div className="mx-auto flex h-dvh w-full max-w-[480px] flex-col overflow-hidden bg-[#efeae2] md:border-x md:border-black/10">
      <header className="flex shrink-0 items-center gap-2 bg-[#008069] px-2 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 text-white">
        <button type="button" onClick={() => router.back()} aria-label="Volver" className="grid size-10 place-items-center rounded-full [touch-action:manipulation] active:bg-white/15">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m15 5-7 7 7 7" />
          </svg>
        </button>
        <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-lg font-semibold text-brand">
          {contact.charAt(0)}
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-[17px] font-medium">{contact}</p>
          <p className="truncate text-[13px] text-white/80" aria-live="polite">
            {typing ? "escribiendo…" : "en línea"}
          </p>
        </div>
      </header>

      <div ref={list} role="log" aria-label="Conversación" className="flex flex-1 flex-col gap-1.5 overflow-y-auto overscroll-contain px-3 py-3">
        <p className="mx-auto mb-2 max-w-[85%] rounded-lg bg-[#ffeecd] px-3 py-1.5 text-center text-[12.5px] leading-snug text-[#54656f]">
          🔒 Demostración: este chat es simulado, no se envía nada a WhatsApp.
        </p>

        {thread === undefined ? (
          <p className="mx-auto mt-6 max-w-[85%] text-center text-sm text-[#54656f]">No encontramos esto en este navegador.</p>
        ) : null}

        {messages.map((message, i) => {
          const own = message.from === mine;
          return (
            <div
              key={i}
              className={`bubble-in flex max-w-[86%] flex-col ${own ? "ml-auto items-end" : "items-start"}`}
            >
              <div
                className={`rounded-lg px-2.5 pt-1.5 pb-1 text-[15px] leading-snug text-[#111b21] shadow-[0_1px_0.5px_rgb(0_0_0/0.13)] ${
                  own ? "rounded-tr-none bg-[#d9fdd3]" : "rounded-tl-none bg-white"
                }`}
              >
                <span className="whitespace-pre-line">{message.text}</span>
                <span className="float-right mt-1 ml-3 flex items-center gap-1 text-[11px] leading-none text-[#667781]">
                  {formatTime(message.at)}
                  {own ? <span className="text-[#53bdeb]"><DoubleCheck /></span> : null}
                </span>
              </div>
            </div>
          );
        })}

        {typing ? (
          <div className="bubble-in flex w-fit items-center gap-1 rounded-lg rounded-tl-none bg-white px-3.5 py-3 shadow-[0_1px_0.5px_rgb(0_0_0/0.13)]" aria-hidden>
            <span className="typing-dot size-2 rounded-full bg-[#8696a0]" />
            <span className="typing-dot size-2 rounded-full bg-[#8696a0]" />
            <span className="typing-dot size-2 rounded-full bg-[#8696a0]" />
          </div>
        ) : null}
      </div>

      <form
        className="flex shrink-0 items-end gap-2 px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <textarea
          name="message"
          rows={draft.length > 90 ? 4 : 1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Mensaje"
          aria-label="Mensaje"
          autoComplete="off"
          maxLength={800}
          className="min-h-11 min-w-0 flex-1 resize-none rounded-3xl bg-white px-4 py-2.5 text-base leading-snug text-[#111b21] shadow-[0_1px_0.5px_rgb(0_0_0/0.13)] outline-none placeholder:text-[#667781] focus-visible:ring-2 focus-visible:ring-[#008069]"
        />
        <button
          type="submit"
          aria-label="Enviar"
          disabled={!draft.trim() || !thread}
          className="grid size-11 shrink-0 place-items-center rounded-full bg-[#008069] text-white [touch-action:manipulation] active:bg-[#006b58] disabled:opacity-60"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
            <path d="M3.4 20.4 21 12 3.4 3.6 3.3 10l12.6 2-12.6 2 .1 6.4Z" />
          </svg>
        </button>
      </form>
    </div>
  );
}
