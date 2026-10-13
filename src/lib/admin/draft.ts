import {
  useCallback,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

/**
 * Edits React state with a mutable-style recipe applied to a deep copy,
 * which keeps nested updates readable:
 *
 *   updateDraft(setTariffs, (tariffs) => { tariffs[0].title = "New"; });
 */
export function updateDraft<T>(
  setState: Dispatch<SetStateAction<T>>,
  recipe: (draft: NonNullable<T>) => void,
) {
  setState((current) => {
    if (current === null || current === undefined) {
      return current;
    }

    const next = structuredClone(current) as NonNullable<T>;
    recipe(next);
    return next;
  });
}

/**
 * Tracks whether `value` differs from the last saved version.
 * Call `markSaved` with the loaded or saved value to reset the baseline.
 */
export function useSavedSnapshot(value: unknown) {
  const [saved, setSaved] = useState<string | null>(null);

  const markSaved = useCallback(
    (savedValue: unknown) => setSaved(JSON.stringify(savedValue)),
    [],
  );

  /** Patches the saved baseline, e.g. for changes persisted outside "Save". */
  const updateSaved = useCallback(
    <S>(recipe: (draft: S) => void) =>
      setSaved((current) => {
        if (current === null) {
          return current;
        }
        const parsed = JSON.parse(current) as S;
        recipe(parsed);
        return JSON.stringify(parsed);
      }),
    [],
  );

  /** Returns a fresh copy of the saved value. */
  const readSaved = <S>(): S | null =>
    saved === null ? null : (JSON.parse(saved) as S);

  return {
    isDirty: saved !== null && JSON.stringify(value) !== saved,
    markSaved,
    updateSaved,
    readSaved,
  };
}
