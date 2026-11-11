import { clinic, dayBefore, dentistFor, dentists, longDay, shortDay, urgentSlot, URGENT } from "@/lib/clinica";
import { addBooking, getDemoState, removeBooking, setBookingStatus, setHandoff, takenSlots } from "@/lib/clinica-store";

// The conversation of the demo assistant: a small state machine of "nodes". Each node is what the bot says,
// then either buttons, the calendar, a free-text answer, or an automatic jump to the next node.

export type Booking = { service?: string; day?: number; time?: string; name?: string; coverage?: string };

export type Msg =
  | { kind: "text"; text: string }
  | { kind: "card"; title: string; rows: readonly (readonly [string, string])[] }
  | { kind: "divider"; text: string }
  | { kind: "note"; text: string };

export type Choice = { label: string; to: string; set?: Partial<Booking> };

export type Node = {
  say: (b: Booking) => Msg[];
  choices?: Choice[];
  /** A button that opens the calendar with the clinic's free times; the chosen day and time go to `to`. */
  picker?: { to: string; label: string };
  /** Waits for a typed answer, stored in `field`. */
  text?: { to: string; field: "name"; placeholder: string };
  /** Continues on its own after `after` ms (the demo's "one day later"). */
  auto?: { to: string; after: number };
  /** Moves the message clock (hour, minute): the reminder arrives the next morning. */
  clock?: readonly [number, number];
  /** Runs when the node starts: what the clinic's agenda has to know. */
  effect?: (b: Booking) => void;
};

const text = (value: string): Msg => ({ kind: "text", text: value });
const firstName = (b: Booking) => b.name?.trim().split(/\s+/)[0] ?? "";
const day = (b: Booking) => (b.day ? shortDay(b.day) : "");

const mainMenu: Choice[] = [
  { label: "Sacar un turno", to: "services" },
  { label: "Tengo una urgencia", to: "urgent" },
  { label: "Hablar con recepción", to: "human" },
];

export const greeting = text(`¡Hola! 👋 Soy el asistente virtual de *${clinic.name}*.`);

/** The slot offered for an urgency: the first one free today, according to the agenda. */
const urgentTime = () => urgentSlot(takenSlots(getDemoState()));

export const SCRIPT: Record<string, Node> = {
  hello: { say: () => [greeting, text("¿En qué te puedo ayudar?")], choices: mainMenu },
  fallback: { say: () => [text("No estoy seguro de haber entendido 🤔 Elegí una opción:")], choices: mainMenu },

  services: {
    say: () => [text("Claro, te ayudo a sacar un turno 🦷 ¿Qué tratamiento necesitás?")],
    choices: ["Limpieza dental", "Consulta y diagnóstico", "Blanqueamiento", "Control de ortodoncia"].map((service) => ({
      label: service,
      to: "days",
      set: { service },
    })),
  },
  days: {
    say: (b) => [
      text(`Perfecto: *${b.service ?? "tu turno"}*, con la *${dentists[dentistFor(b.service)].name}*.`),
      text("Mirá el calendario con los horarios libres de su agenda y elegí el que te quede mejor 📅"),
    ],
    picker: { to: "name", label: "Elegir día y horario" },
  },
  name: {
    say: () => [text("Genial 🙌 ¿A nombre de quién agendo el turno?")],
    text: { to: "coverage", field: "name", placeholder: "Nombre y apellido" },
  },
  coverage: {
    say: (b) => [text(`Gracias, ${firstName(b)}. ¿Tenés obra social o prepaga?`)],
    choices: ["OSDE", "Swiss Medical", "Particular"].map((coverage) => ({ label: coverage, to: "confirm", set: { coverage } })),
  },
  confirm: {
    say: (b) => [
      {
        kind: "card",
        title: "Revisá tu turno",
        rows: [
          ["Paciente", b.name ?? ""],
          ["Tratamiento", b.service ?? ""],
          ["Día", day(b)],
          ["Hora", `${b.time} hs`],
          ["Profesional", dentists[dentistFor(b.service)].name],
          ["Cobertura", b.coverage ?? ""],
        ],
      },
      text("¿Lo confirmo?"),
    ],
    choices: [
      { label: "Confirmar turno", to: "booked" },
      { label: "Cambiar horario", to: "days" },
    ],
  },
  booked: {
    // The turno goes into the clinic's agenda (and out of the calendar) right away.
    effect: (b) => {
      if (!b.day || !b.time) return;
      addBooking({
        id: "turno",
        date: b.day,
        time: b.time,
        patient: b.name ?? "Paciente nuevo",
        service: b.service ?? "Consulta y diagnóstico",
        dentist: dentistFor(b.service),
        coverage: b.coverage ?? "Particular",
        status: "scheduled",
        fresh: "Nuevo por WhatsApp",
      });
    },
    say: (b) => [
      text(`✅ *¡Turno confirmado, ${firstName(b)}!*`),
      text(`Te esperamos el ${day(b)} a las ${b.time} hs en *${clinic.name}* (${clinic.address}).`),
      text("Un día antes te mando un recordatorio para que confirmes. Si necesitás cambiar algo, escribime por acá."),
    ],
    auto: { to: "reminder", after: 2600 },
  },

  reminder: {
    clock: [9, 0],
    say: (b) => [
      { kind: "divider", text: b.day ? longDay(dayBefore(b.day)) : "Un día antes" },
      text(`Hola ${firstName(b)} 👋 Te recordamos tu turno del *${day(b)}* a las *${b.time} hs* (${b.service}). ¿Confirmás tu asistencia?`),
    ],
    choices: [
      { label: "Confirmo", to: "reminderOk" },
      { label: "Reprogramar", to: "days" },
      { label: "Cancelar", to: "cancelled" },
    ],
  },
  reminderOk: {
    effect: () => setBookingStatus("turno", "confirmed"),
    say: (b) => [
      text(`¡Perfecto, ${firstName(b)}! Tu turno quedó confirmado ✅`),
      text("Si tenés dolor o una urgencia antes de la fecha, escribime por acá."),
    ],
    choices: [
      { label: "Tengo una urgencia", to: "urgent" },
      { label: "Hablar con recepción", to: "human" },
    ],
  },
  cancelled: {
    effect: () => removeBooking("turno"),
    say: () => [text("Listo, cancelé tu turno. Cuando quieras uno nuevo, escribime 😊")],
    choices: [{ label: "Sacar un turno", to: "services" }],
  },

  urgent: {
    say: () => {
      const time = urgentTime();
      return time
        ? [
            text("Lamento que estés con dolor 😔 Voy a buscarte el primer lugar de urgencia."),
            text(`Hoy tengo un lugar a las *${time}* con el *${dentists[URGENT.dentist].name}*. ¿Te lo reservo?`),
          ]
        : [text("Lamento que estés con dolor 😔 Hoy ya no tengo lugares libres: te paso con recepción para que te ayuden enseguida.")];
    },
    choices: [
      { label: "Sí, reservarlo", to: "urgentBooked" },
      { label: "Prefiero otro horario", to: "days" },
    ],
  },
  urgentBooked: {
    effect: (b) => {
      const time = urgentTime();
      if (!time) return;
      addBooking({
        id: "urgencia",
        date: URGENT.date,
        time,
        patient: b.name ?? "Paciente nuevo",
        service: "Urgencia: dolor de muela",
        dentist: URGENT.dentist,
        coverage: b.coverage ?? "Particular",
        status: "confirmed",
        fresh: "Urgencia por WhatsApp",
      });
    },
    say: () => {
      // The effect has just taken the slot, so the agenda's next free one is not the one booked: read it back.
      const booked = getDemoState().bookings.find((x) => x.id === "urgencia");
      return [
        {
          kind: "card",
          title: "Urgencia reservada",
          rows: [
            ["Hoy", booked ? `${booked.time} hs` : ""],
            ["Profesional", dentists[URGENT.dentist].name],
            ["Dirección", clinic.address],
          ],
        },
        text(`Si el dolor empeora antes, avisame por acá o llamá al ${clinic.phone}.`),
      ];
    },
    choices: [{ label: "Hablar con recepción", to: "human" }],
  },

  human: {
    effect: (b) => setHandoff(b.name ?? "Paciente nuevo"),
    say: () => [
      { kind: "note", text: "Romina, de recepción, se unió a la conversación" },
      text("Te paso con *Romina*, de recepción 👩‍💼 Te responde en unos minutos."),
    ],
  },
};

const plain = (value: string) => value.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Picks the node for a free-text message, so typing works as well as the buttons. */
export function route(message: string): string {
  const t = plain(message);
  if (/dolor|duele|duelen|urgenc|muela|sangr|golpe|hinch/.test(t)) return "urgent";
  if (/recepci|persona|humano|operador|hablar con/.test(t)) return "human";
  if (/turno|cita|reserv|agendar|sacar/.test(t)) return "services";
  if (/cancel/.test(t)) return "cancelled";
  if (/^(hola|buen)/.test(t)) return "hello";
  return "fallback";
}
