// Their posters: a heavy slab serif for the titles ("MENÚ LUNES", "RESERVAS") over a clean geometric sans.
import { Alfa_Slab_One, Montserrat } from "next/font/google";

export const display = Alfa_Slab_One({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

export const body = Montserrat({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});
