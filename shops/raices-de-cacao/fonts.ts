// Their stories: a light high-contrast serif for titles ("HORARIOS DE ATENCIÓN") over a bold geometric sans.
import { Cormorant_Garamond, Montserrat } from "next/font/google";

export const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
});

export const body = Montserrat({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});
