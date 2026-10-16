import localFont from "next/font/local";

export const mulish = localFont({
  src: [
    { path: "../assets/fonts/subset-Mulish-Regular.woff2", weight: "400", style: "normal" },
    { path: "../assets/fonts/subset-Mulish-SemiBold.woff2", weight: "600", style: "normal" },
  ],
  declarations: [{ prop: "font-family", value: "Mulish" }],
  variable: "--font-mulish",
  display: "swap",
  preload: true,
});

// Share the family, but do not preload weights that are absent from the first screen.
export const mulishAdditional = localFont({
  src: [
    { path: "../assets/fonts/subset-Mulish-Italic.woff2", weight: "400", style: "italic" },
    { path: "../assets/fonts/subset-Mulish-Medium.woff2", weight: "500", style: "normal" },
    { path: "../assets/fonts/subset-Mulish-Bold.woff2", weight: "700", style: "normal" },
    { path: "../assets/fonts/subset-Mulish-BoldItalic.woff2", weight: "700", style: "italic" },
  ],
  declarations: [{ prop: "font-family", value: "Mulish" }],
  variable: "--font-mulish-additional",
  adjustFontFallback: false,
  display: "swap",
  preload: false,
});

export const play = localFont({
  src: [
    { path: "../assets/fonts/subset-Play-Regular.woff2", weight: "400", style: "normal" },
    { path: "../assets/fonts/subset-Play-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-play",
  display: "swap",
  preload: false,
});
