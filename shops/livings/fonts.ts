// Their printed menu: a light Garamond serif for the wordmark and titles over a humanist sans (PT Sans).
import { EB_Garamond, PT_Sans } from "next/font/google";

export const display = EB_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const body = PT_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "700"],
});
