// Their website: Fraunces for titles over Plus Jakarta Sans.
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";

export const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const body = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});
