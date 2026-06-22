import { Playfair_Display } from "next/font/google";

export const pageHintFont = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700"],
});

/** Shared label styles for page hint, nav signs, and review mode tiles */
export const pageHintTextClassName =
  "font-normal tracking-[0.01em] text-[#222222]";
