import { useCallback, useState } from 'react';

/**
 * The persisted sort preference for the order list.
 *
 * Storage is the part of sorting that can fail in ways the component cannot:
 * the key can hold a value written by an older build, and `localStorage` itself
 * throws when it is disabled. Both paths fall back to "no sort" rather than
 * taking the list down with them, so they live here and not in the component.
 */

export const SORT_COLUMNS = ['id', 'status', 'total', 'placedAt'] as const;
export type SortColumn = (typeof SORT_COLUMNS)[number];

export const SORT_DIRECTIONS = ['ascending', 'descending'] as const;
export type SortDirection = (typeof SORT_DIRECTIONS)[number];

export interface SortPreference {
  readonly column: SortColumn;
  readonly direction: SortDirection;
}

export const SORT_STORAGE_KEY = 'orderList.sort';

function isSortColumn(value: unknown): value is SortColumn {
  return SORT_COLUMNS.includes(value as SortColumn);
}

function isSortDirection(value: unknown): value is SortDirection {
  return SORT_DIRECTIONS.includes(value as SortDirection);
}

function read(): SortPreference | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SORT_STORAGE_KEY);
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const { column, direction } = parsed as { column?: unknown; direction?: unknown };
    if (!isSortColumn(column) || !isSortDirection(direction)) return null;
    return { column, direction };
  } catch {
    // Unparseable value, or storage that refuses to be read. Either way there
    // is no preference to honour.
    return null;
  }
}

function write(preference: SortPreference): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SORT_STORAGE_KEY, JSON.stringify(preference));
  } catch {
    // The sort still applies for the rest of the session; only the memory of
    // it is lost.
  }
}

/**
 * Returns the stored preference, or null when there is none to honour, plus a
 * setter that records the new one.
 */
export function useSortPreference(): readonly [
  SortPreference | null,
  (preference: SortPreference) => void,
] {
  const [preference, setPreference] = useState<SortPreference | null>(read);

  const update = useCallback((next: SortPreference) => {
    setPreference(next);
    write(next);
  }, []);

  return [preference, update];
}
