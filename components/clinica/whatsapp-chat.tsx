"use client";

import { useEffect, useRef, useState } from "react";
import { clinic, shortDay } from "@/lib/clinica";
import { resetDemo } from "@/lib/clinica-store";
import { BackIcon, CalendarIcon, DoubleCheckIcon, MicIcon, SendIcon, ToothIcon, VerifiedIcon } from "./icons";
import { DayPicker } from "./day-picker";
import { SCRIPT, greeting, route, type Booking, type Choice, type Msg, type Node } from "./chat-script";

// A WhatsApp-style chat with the clinic's assistant. Nothing is sent anywhere: the bot is the script in
// chat-script.ts, played with timers (so the demo video can drive it frame by frame).

type Item = { id: number; who: "bot" | "user"; msg: Msg; time: string; choices?: Choice[]; picker?: Node["picker"]; picked?: string };

const wait = (ms: number) => new Promise<void>((done) => setTimeout(done, ms));
const typingMs = (msg: Msg) => (msg.kind === "text" ? 700 + Math.min(msg.text.length * 14, 1100) : 900);

const suggestions = ["Quiero sacar un turno", "Me duele una muela", "Hablar con recepción"];

/** `*bold*` as <strong>; everything else stays plain text. */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*[^*]+\*)/g).map((part, i) =>
        part.length > 2 && part.startsWith("*") && part.endsWith("*") ? <strong key={i}>{part.slice(1, -1)}</strong> : part,
      )}
    </>
  );
}

export function WhatsAppChat() {
  const [items, setItems] = useState<Item[]>([]);
  const [typing, setTyping] = useState(false);
  const [busy, setBusy] = useState(false);
  const [awaiting, setAwaiting] = useState<Node["text"]>();
  const [draft, setDraft] = useState("");
  const [picking, setPicking] = useState<{ picker: NonNullable<Node["picker"]>; service?: string }>();
  const booking = useRef<Booking>({});
  const nextId = useRef(1);
  const clock = useRef({ h: 10, m: 41 });
  const alive = useRef(true);
  const list = useRef<HTMLDivElement>(null);

  useEffect(() => {
    alive.current = true;
    resetDemo(); // every demo starts from the clinic's own turnos
    return () => {
      alive.current = false;
    };
  }, []);

  // Keep the last message in view.
  useEffect(() => {
    const el = list.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ top: el.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [items, typing]);

  function stamp() {
    const c = clock.current;
    c.m += 1;
    if (c.m > 59) {
      c.m = 0;
      c.h += 1;
    }
    return `${String(c.h).padStart(2, "0")}:${String(c.m).padStart(2, "0")}`;
  }

  function push(who: Item["who"], msg: Msg, choices?: Choice[], picker?: Node["picker"]) {
    // Outside the updater: React may run updaters twice (Strict Mode), which would skip ids and minutes.
    const item: Item = { id: nextId.current++, who, msg, time: stamp(), choices, picker };
    setItems((prev) => [...prev, item]);
  }

  async function play(id: string, prefix: Msg[] = []): Promise<void> {
    const node = SCRIPT[id];
    if (node.clock) clock.current = { h: node.clock[0], m: node.clock[1] };
    node.effect?.(booking.current);
    const msgs = [...prefix, ...node.say(booking.current)];
    setAwaiting(undefined);
    for (const [i, msg] of msgs.entries()) {
      if (msg.kind === "text" || msg.kind === "card") {
        setTyping(true);
        await wait(typingMs(msg));
        if (!alive.current) return;
        setTyping(false);
      } else {
        await wait(600);
        if (!alive.current) return;
      }
      const last = i === msgs.length - 1;
      push("bot", msg, last ? node.choices : undefined, last ? node.picker : undefined);
    }
    if (node.text) setAwaiting(node.text);
    if (node.auto) {
      await wait(node.auto.after);
      if (alive.current) await play(node.auto.to);
    }
  }

  async function send(raw: string, choice?: Choice) {
    const message = raw.trim();
    if (!message || busy) return;
    const firstMessage = items.length === 0;
    // Whatever buttons were on screen are answered now, tapped or not.
    setItems((prev) => prev.map((it) => ((it.choices || it.picker) && it.picked === undefined ? { ...it, picked: choice?.label ?? "" } : it)));
    push("user", { kind: "text", text: message });
    setDraft("");
    setBusy(true);
    if (choice) {
      booking.current = { ...booking.current, ...choice.set };
      await play(choice.to);
    } else if (awaiting) {
      booking.current = { ...booking.current, [awaiting.field]: message };
      await play(awaiting.to);
    } else {
      const to = route(message);
      await play(to, firstMessage && to !== "hello" ? [greeting] : []);
    }
    if (alive.current) setBusy(false);
  }

  const status = typing ? "escribiendo…" : "cuenta de empresa";

  return (
    <div className="mx-auto flex h-dvh w-full max-w-[480px] flex-col overflow-hidden bg-[#efeae2] md:border-x md:border-black/10">
      {/* The calendar sheet covers the chat; behind it nothing can be reached. */}
      <div className="flex min-h-0 flex-1 flex-col" inert={picking !== undefined}>
      <header className="flex shrink-0 items-center gap-2 bg-[#008069] px-2 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 text-white">
        <button type="button" aria-label="Volver" className="grid size-10 place-items-center rounded-full [touch-action:manipulation] active:bg-white/15">
          <BackIcon width={24} height={24} />
        </button>
        <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-brand">
          <ToothIcon width={24} height={24} />
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="flex items-center gap-1 truncate text-[17px] font-medium">
            {clinic.name}
            <VerifiedIcon className="shrink-0 text-[#25d366]" />
          </p>
          <p className="truncate text-[13px] text-white/80" aria-live="polite">
            {status}
          </p>
        </div>
      </header>

      <div ref={list} role="log" aria-label="Conversación" className="flex flex-1 flex-col gap-1.5 overflow-y-auto overscroll-contain px-3 py-3">
        <p className="mx-auto mb-2 max-w-[85%] rounded-lg bg-[#ffeecd] px-3 py-1.5 text-center text-[12.5px] leading-snug text-[#54656f]">
          🔒 Demostración: el asistente y los turnos son simulados, no se envía nada.
        </p>

        {items.map((item) => (
          <MessageRow key={item.id} item={item} onChoose={(choice) => send(choice.label, choice)} onPick={(picker) => setPicking({ picker, service: booking.current.service })} disabled={busy} />
        ))}

        {typing ? (
          <div className="bubble-in flex w-fit items-center gap-1 rounded-lg rounded-tl-none bg-white px-3.5 py-3 shadow-[0_1px_0.5px_rgb(0_0_0/0.13)]" aria-hidden>
            <span className="typing-dot size-2 rounded-full bg-[#8696a0]" />
            <span className="typing-dot size-2 rounded-full bg-[#8696a0]" />
            <span className="typing-dot size-2 rounded-full bg-[#8696a0]" />
          </div>
        ) : null}
      </div>

      <div className="shrink-0 px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {items.length === 0 ? (
          <div className="mb-2 flex flex-wrap gap-2">
            {suggestions.map((text) => (
              <button
                key={text}
                type="button"
                onClick={() => send(text)}
                className="rounded-full bg-white px-3.5 py-2 text-sm text-[#008069] shadow-[0_1px_0.5px_rgb(0_0_0/0.13)] [touch-action:manipulation] active:bg-[#f0f2f5]"
              >
                {text}
              </button>
            ))}
          </div>
        ) : null}
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void send(draft);
          }}
        >
          <input
            name="message"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={awaiting?.placeholder ?? "Mensaje"}
            aria-label="Mensaje"
            autoComplete="off"
            enterKeyHint="send"
            maxLength={80}
            className="h-11 min-w-0 flex-1 rounded-full bg-white px-4 text-base text-[#111b21] shadow-[0_1px_0.5px_rgb(0_0_0/0.13)] outline-none placeholder:text-[#667781] focus-visible:ring-2 focus-visible:ring-[#008069]"
          />
          <button
            type="submit"
            aria-label={draft.trim() ? "Enviar" : "Mensaje de voz"}
            disabled={busy && draft.trim() !== ""}
            className="grid size-11 shrink-0 place-items-center rounded-full bg-[#008069] text-white [touch-action:manipulation] active:bg-[#006b58] disabled:opacity-60"
          >
            {draft.trim() ? <SendIcon width={22} height={22} /> : <MicIcon width={22} height={22} />}
          </button>
        </form>
      </div>
      </div>

      {picking ? (
        <DayPicker
          service={picking.service}
          onClose={() => setPicking(undefined)}
          onConfirm={(date, time) => {
            const { picker } = picking;
            setPicking(undefined);
            void send(`${shortDay(date)} · ${time} hs`, { label: `${shortDay(date)} · ${time} hs`, to: picker.to, set: { day: date, time } });
          }}
        />
      ) : null}
    </div>
  );
}

function MessageRow({ item, onChoose, onPick, disabled }: { item: Item; onChoose: (choice: Choice) => void; onPick: (picker: NonNullable<Item["picker"]>) => void; disabled: boolean }) {
  const { msg } = item;

  if (msg.kind === "divider") {
    return <p className="bubble-in mx-auto my-2 rounded-lg bg-white/90 px-3 py-1 text-[12.5px] text-[#54656f] shadow-[0_1px_0.5px_rgb(0_0_0/0.13)]">{msg.text}</p>;
  }
  if (msg.kind === "note") {
    return <p className="bubble-in mx-auto my-1 max-w-[85%] rounded-lg bg-[#ffeecd] px-3 py-1 text-center text-[12.5px] text-[#54656f]">{msg.text}</p>;
  }

  const mine = item.who === "user";
  return (
    <div className={`bubble-in flex max-w-[84%] flex-col gap-1 ${mine ? "ml-auto items-end" : "items-start"}`}>
      <div
        className={`rounded-lg px-2.5 pt-1.5 pb-1 text-[15px] leading-snug text-[#111b21] shadow-[0_1px_0.5px_rgb(0_0_0/0.13)] ${
          mine ? "rounded-tr-none bg-[#d9fdd3]" : "rounded-tl-none bg-white"
        }`}
      >
        {msg.kind === "card" ? (
          <div className="min-w-56 pb-1">
            <p className="mb-1.5 font-semibold">{msg.title}</p>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-sm">
              {msg.rows.map(([label, value]) => (
                <div key={label} className="contents">
                  <dt className="text-[#667781]">{label}</dt>
                  <dd className="text-right font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ) : (
          <span className="whitespace-pre-line">
            <Rich text={msg.text} />
          </span>
        )}
        <span className="float-right mt-1 ml-3 flex items-center gap-1 text-[11px] leading-none text-[#667781]">
          {item.time}
          {mine ? <DoubleCheckIcon className="text-[#53bdeb]" /> : null}
        </span>
      </div>

      {item.picker ? (
        <button
          type="button"
          disabled={item.picked !== undefined || disabled}
          onClick={() => item.picker && onPick(item.picker)}
          className={`flex h-11 w-full min-w-56 items-center justify-center gap-2 rounded-lg bg-white px-3 text-[15px] font-medium shadow-[0_1px_0.5px_rgb(0_0_0/0.13)] [touch-action:manipulation] transition-[background-color,transform,opacity] duration-100 active:scale-[0.97] motion-reduce:active:scale-100 ${
            item.picked !== undefined ? "text-[#8696a0] opacity-70" : "text-[#027eb5] active:bg-[#f0f2f5]"
          }`}
        >
          <CalendarIcon width={18} height={18} />
          {item.picker.label}
        </button>
      ) : null}

      {item.choices ? (
        <div className="flex w-full min-w-56 flex-col gap-1" role="group" aria-label="Respuestas rápidas">
          {item.choices.map((choice) => {
            const answered = item.picked !== undefined;
            const chosen = item.picked === choice.label;
            return (
              <button
                key={choice.label}
                type="button"
                disabled={answered || disabled}
                aria-pressed={answered ? chosen : undefined}
                onClick={() => onChoose(choice)}
                className={`h-11 rounded-lg bg-white px-3 text-[15px] font-medium shadow-[0_1px_0.5px_rgb(0_0_0/0.13)] [touch-action:manipulation] transition-[background-color,transform,opacity] duration-100 active:scale-[0.97] motion-reduce:active:scale-100 ${
                  chosen ? "text-[#008069]" : answered ? "text-[#8696a0] opacity-70" : "text-[#027eb5] active:bg-[#f0f2f5]"
                }`}
              >
                {choice.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
