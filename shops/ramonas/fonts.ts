// Their logo: a brush script for "Ramona's" over a DIN-like sans. Script for the titles, the sans for the rest.
import { Barlow, Pacifico } from "next/font/google";

export const display = Pacifico({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

export const body = Barlow({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});
