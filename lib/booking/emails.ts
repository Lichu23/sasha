// The emails of the nutrition practice (simulated: nothing is sent). The booking confirmation is built from the booking itself;
// the email after the visit is chosen in the panel from these templates, with the pictures the nutritionist attaches.

export type MailImage = { id: string; label: string; src: string };
export const MAIL_IMAGES: MailImage[] = [
  { id: "plan", label: "Plan semanal", src: "/booking/nutricion/mail/plan-semanal.svg" },
  { id: "compras", label: "Lista de compras", src: "/booking/nutricion/mail/lista-de-compras.svg" },
  { id: "recetas", label: "Recetas", src: "/booking/nutricion/mail/recetas.svg" },
];

export type MailTemplate = { id: string; name: string; subject: string; intro: string; points: string[]; outro: string };
export const MAIL_TEMPLATES: MailTemplate[] = [
  {
    id: "plan",
    name: "Plan alimentario",
    subject: "Tu plan alimentario y las recomendaciones de hoy",
    intro: "Gracias por venir. Te dejo adjunto tu plan y lo que charlamos en la consulta.",
    points: ["Tomá 2 litros de agua por día.", "Hacé 4 comidas, sin saltearte el desayuno.", "Probá las recetas de la semana y contame cómo te fue."],
    outro: "Cualquier duda, respondé este email. ¡Nos vemos en el próximo control!",
  },
  {
    id: "control",
    name: "Próximo control",
    subject: "Tu próximo control, en 15 días",
    intro: "Para ver cómo te fue con el plan, agendá tu consulta de seguimiento.",
    points: ["Traé tu registro de comidas de la semana.", "Anotá cómo te sentiste con los cambios.", "Si tenés estudios nuevos, mandámelos antes."],
    outro: "Podés reservar el turno desde la web, cuando quieras.",
  },
];
export const templateOf = (id: string) => MAIL_TEMPLATES.find((t) => t.id === id) ?? MAIL_TEMPLATES[0];

/** Where the patient cancels a booking: the link in the confirmation email. */
export const cancelPath = (ref: string) => `/nutricion/cancelar?ref=${encodeURIComponent(ref)}`;
