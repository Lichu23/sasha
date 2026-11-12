import type { ClinicConfig } from "@/lib/types";

const weekdays = [1, 2, 3, 4, 5];
const days = (windows: [string, string][], list = weekdays) =>
  Object.fromEntries(list.map((d) => [d, windows]));

// Fictional clinic for a sales demo: names, phone numbers and prices are examples.
export const auroraDental: ClinicConfig = {
  slug: "aurora-dental",
  name: "Aurora Dental",
  kind: "Clínica dental",
  tagline: "Tu sonrisa, con turno y sin vueltas",
  description: "Reservá tu turno online en menos de un minuto, elegí profesional y recibí el recordatorio por mail.",
  address: "Av. Siempreviva 1234",
  city: "Buenos Aires",
  whatsapp: "5491100000000",
  phone: "+54 11 0000-0000",
  hours: [
    { label: "Lunes a viernes", value: "9:00 a 19:00" },
    { label: "Sábados", value: "9:00 a 13:00" },
    { label: "Domingos", value: "Cerrado" },
  ],
  theme: { brand: "#0f8b8d", brandInk: "#0a6466", soft: "#e3f4f4" },
  slotStepMinutes: 30,
  bookingWindowDays: 30,
  leadMinutes: 120,
  cancelUntilHours: 24,
  coverages: ["Particular", "OSDE", "Swiss Medical", "Galeno", "Medifé", "OMINT"],
  clientWord: "paciente",
  services: [
    { id: "consulta", name: "Consulta y revisión", description: "Primera visita, diagnóstico y plan de tratamiento.", minutes: 30, priceFrom: 18000 },
    { id: "limpieza", name: "Limpieza dental", description: "Remoción de sarro y pulido.", minutes: 30, priceFrom: 25000 },
    { id: "caries", name: "Arreglo de caries", description: "Restauración con resina del color del diente.", minutes: 60, priceFrom: 35000 },
    { id: "blanqueamiento", name: "Blanqueamiento", description: "Sesión en consultorio, resultado visible el mismo día.", minutes: 60, priceFrom: 90000 },
    { id: "ortodoncia", name: "Consulta de ortodoncia", description: "Evaluación para brackets o alineadores.", minutes: 30, priceFrom: 20000 },
    { id: "endodoncia", name: "Endodoncia", description: "Tratamiento de conducto.", minutes: 90, priceFrom: 80000 },
    { id: "urgencia", name: "Urgencia (dolor)", description: "Atención prioritaria por dolor o golpe.", minutes: 30, priceFrom: 22000 },
  ],
  professionals: [
    {
      id: "ferreyra",
      name: "Dra. Camila Ferreyra",
      role: "Odontología general",
      serviceIds: ["consulta", "limpieza", "caries", "blanqueamiento", "urgencia"],
      schedule: {
        ...days([["09:00", "13:00"], ["14:30", "19:00"]]),
        6: [["09:00", "13:00"]],
      },
    },
    {
      id: "roldan",
      name: "Dr. Matías Roldán",
      role: "Ortodoncia",
      serviceIds: ["consulta", "ortodoncia", "urgencia"],
      schedule: days([["10:00", "13:00"], ["15:00", "19:00"]], [2, 3, 4]),
    },
    {
      id: "sosa",
      name: "Dra. Julieta Sosa",
      role: "Endodoncia y implantes",
      serviceIds: ["consulta", "endodoncia", "caries", "urgencia"],
      schedule: days([["09:00", "13:00"], ["14:30", "18:00"]], [1, 3, 5]),
    },
  ],
  // Stock photos of other clinics (Wikimedia Commons), only to make the demo look real. Credits are shown at /creditos.
  photos: {
    hero: {
      src: "/clinic/aurora-dental/recepcion.jpg",
      width: 1920,
      height: 1281,
      alt: "Recepción luminosa de una clínica dental, con dos personas atendiendo al paciente",
      credit: {
        title: "Reception Centro Odontoiatrico Leone.jpg",
        author: "MLeoneDentist",
        license: "CC0",
        source: "https://commons.wikimedia.org/wiki/File:Reception_Centro_Odontoiatrico_Leone.jpg",
      },
    },
    gallery: [
      {
        src: "/clinic/aurora-dental/consultorio-1.jpg",
        width: 1920,
        height: 1440,
        alt: "Consultorio con sillón odontológico y equipamiento",
        credit: {
          title: "A dental chair in a dentist clinic in North Carolina, United States.jpg",
          author: "Harrison Keely",
          license: "CC BY 4.0",
          source:
            "https://commons.wikimedia.org/wiki/File:A_dental_chair_in_a_dentist_clinic_in_North_Carolina,_United_States.jpg",
        },
      },
      {
        src: "/clinic/aurora-dental/consultorio-2.jpg",
        width: 1920,
        height: 1282,
        alt: "Consultorio luminoso con sillón y mesa de instrumental",
        credit: {
          title: "Dentist office and equipment (49899000186).jpg",
          author: "Nenad Stojkovic",
          license: "CC BY 2.0",
          source: "https://commons.wikimedia.org/wiki/File:Dentist_office_and_equipment_(49899000186).jpg",
        },
      },
    ],
  },
  faq: [
    {
      question: "¿Cómo reservo un turno?",
      answer: "Elegís el tratamiento, el profesional, el día y la hora, y dejás tus datos. Te llega la confirmación por mail y podés agregar el turno a tu calendario.",
    },
    {
      question: "¿Puedo cancelar o cambiar mi turno?",
      answer: "Sí, desde el link de tu confirmación hasta 24 horas antes. Si es más tarde, escribinos por WhatsApp y lo resolvemos.",
    },
    {
      question: "¿Trabajan con obra social o prepaga?",
      answer: "Sí, con las que figuran en esta página. Al reservar elegís la tuya, o Particular, y traés el carnet el día del turno.",
    },
    {
      question: "Tengo dolor, ¿me pueden atender hoy?",
      answer: "Reservá \"Urgencia (dolor)\": tiene prioridad en la agenda. Si no ves horarios libres hoy, escribinos por WhatsApp.",
    },
    {
      question: "¿Cuánto dura cada tratamiento?",
      answer: "Lo ves en cada servicio, junto con el precio desde. El profesional te confirma el valor final después de la consulta.",
    },
  ],
};
