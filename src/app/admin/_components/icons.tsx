import type { SVGProps } from "react";

function createIcon(paths: string[], { fill = false } = {}) {
  return function Icon(props: SVGProps<SVGSVGElement>) {
    return (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill={fill ? "currentColor" : "none"}
        stroke={fill ? "none" : "currentColor"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        {...props}
      >
        {paths.map((d) => (
          <path key={d} d={d} />
        ))}
      </svg>
    );
  };
}

export const ArrowUpIcon = createIcon(["M12 19V5", "M5 12l7-7 7 7"]);
export const ArrowDownIcon = createIcon(["M12 5v14", "M19 12l-7 7-7-7"]);
export const ChevronDownIcon = createIcon(["M6 9l6 6 6-6"]);
export const CheckIcon = createIcon(["M20 6L9 17l-5-5"]);
export const CloseIcon = createIcon(["M18 6L6 18", "M6 6l12 12"]);
export const PlusIcon = createIcon(["M12 5v14", "M5 12h14"]);
export const UndoIcon = createIcon(["M3 7v6h6", "M21 17a9 9 0 0 0-15-6.7L3 13"]);
export const TrashIcon = createIcon([
  "M3 6h18",
  "M8 6V4h8v2",
  "M19 6l-1 14H6L5 6",
  "M10 11v6",
  "M14 11v6",
]);
export const LogoutIcon = createIcon([
  "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",
  "M16 17l5-5-5-5",
  "M21 12H9",
]);
export const ExternalLinkIcon = createIcon([
  "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",
  "M15 3h6v6",
  "M10 14L21 3",
]);
export const AlertIcon = createIcon([
  "M12 9v4",
  "M12 17h.01",
  "M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z",
]);
export const InfoIcon = createIcon([
  "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
  "M12 16v-4",
  "M12 8h.01",
]);

export const GripIcon = createIcon(
  [
    "M9 5m-1.5 0a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0",
    "M15 5m-1.5 0a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0",
    "M9 12m-1.5 0a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0",
    "M15 12m-1.5 0a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0",
    "M9 19m-1.5 0a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0",
    "M15 19m-1.5 0a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0",
  ],
  { fill: true },
);
