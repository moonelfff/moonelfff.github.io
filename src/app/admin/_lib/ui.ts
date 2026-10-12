export const STATUS_MESSAGE_TIMEOUT_MS = 4000;

const buttonBase =
  "cursor-pointer rounded-xl border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";
const headerButtonBase =
  "cursor-pointer shrink-0 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";

const secondaryColors = "border-platinum/35 bg-black/20 text-platinum hover:bg-black/30";
const primaryColors = "border-gold/45 bg-dusty-grape text-platinum hover:bg-dusty-grape/90";

export const secondaryButtonClass = `${buttonBase} ${secondaryColors}`;
export const primaryButtonClass = `${buttonBase} ${primaryColors}`;
export const headerSecondaryButtonClass = `${headerButtonBase} ${secondaryColors}`;
export const headerPrimaryButtonClass = `${headerButtonBase} ${primaryColors}`;
export const subtleButtonClass =
  "cursor-pointer rounded-lg border border-platinum/25 bg-black/15 px-3 py-1.5 text-xs font-medium text-platinum/90 transition hover:bg-black/25 disabled:cursor-not-allowed disabled:opacity-45";
export const subtleDangerButtonClass =
  "cursor-pointer rounded-lg border border-red-300/45 bg-red-900/25 px-3 py-1.5 text-xs font-medium text-red-100 transition hover:bg-red-900/40 disabled:cursor-not-allowed disabled:opacity-45";
export const inputClass =
  "rounded-lg border border-platinum/35 bg-soft-linnen/95 px-3 py-2 text-black outline-none transition focus:border-gold";
export const textareaClass =
  "w-full rounded-lg border border-platinum/35 bg-soft-linnen/95 p-3 font-mono text-sm text-black outline-none transition focus:border-gold";
