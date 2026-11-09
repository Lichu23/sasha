// Their printed menu: a classic serif for titles over Montserrat.
import { Montserrat, Playfair_Display } from "next/font/google";

export const display = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const body = Montserrat({
  variable: "--font-body",
  subsets: ["latin"],
});
