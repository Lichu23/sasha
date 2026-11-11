// A classic serif for titles, close to the calligraphic feel of their logo, over a clean sans for the menu.
import { Nunito_Sans, Playfair_Display } from "next/font/google";

export const display = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const body = Nunito_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});
