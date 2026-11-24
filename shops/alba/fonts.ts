// Their posts: an italic serif for the claims ("Tu nuevo favorito") and a clean sans for the rest.
import { Montserrat, Playfair_Display } from "next/font/google";

export const display = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
});

export const body = Montserrat({
  variable: "--font-body",
  subsets: ["latin"],
});
