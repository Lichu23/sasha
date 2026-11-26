// Their logo is a soft, rounded lowercase "mandala": a rounded display font for the titles, a friendly sans for the rest.
import { Fredoka, Nunito } from "next/font/google";

export const display = Fredoka({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const body = Nunito({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});
