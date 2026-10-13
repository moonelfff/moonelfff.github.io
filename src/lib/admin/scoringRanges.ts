import type { EditableScoring } from "./editable";

export function toNumber(value: string): number | null {
  const parsed = Number(value.trim().replace(",", "."));
  return value.trim() !== "" && Number.isFinite(parsed) ? parsed : null;
}

/** Describes gaps and overlaps between score ranges within [from, to]. */
export function levelWarnings(
  scoring: EditableScoring,
  from: number,
  to: number,
): string[] {
  const parsed = scoring.levels
    .map((level) => ({ min: toNumber(level.min), max: toNumber(level.max) }))
    .filter(
      (level): level is { min: number; max: number } =>
        level.min !== null && level.max !== null,
    )
    .sort((a, b) => a.min - b.min);

  if (parsed.length === 0) {
    return [];
  }

  const warnings: string[] = [];
  if (parsed[0].min > from) {
    warnings.push(
      `Баллы от ${from} до ${parsed[0].min - 1} не попадают ни в один диапазон.`,
    );
  }
  for (let i = 1; i < parsed.length; i += 1) {
    const prev = parsed[i - 1];
    const next = parsed[i];
    if (next.min <= prev.max) {
      warnings.push(
        `Диапазоны ${prev.min}–${prev.max} и ${next.min}–${next.max} пересекаются.`,
      );
    } else if (next.min > prev.max + 1) {
      warnings.push(
        `Баллы от ${prev.max + 1} до ${next.min - 1} не попадают ни в один диапазон.`,
      );
    }
  }
  const last = parsed[parsed.length - 1];
  if (last.max < to) {
    warnings.push(
      `Баллы от ${last.max + 1} до ${to} не попадают ни в один диапазон.`,
    );
  }
  return warnings;
}
