import { useSearchParams } from "react-router-dom";

/**
 * Like useState for multiple parameters, serialized in the URL.
 * Allows atomic updates of multiple parameters to avoid race conditions.
 */
export function useSearchParamsStateMultiple<T extends Record<string, string>>(
  defaults: T
): readonly [
  state: T,
  setState: (updates: Partial<T>) => void,
] {
  const [searchParams, setSearchParams] = useSearchParams();

  // Get current state from URL or defaults
  const state = Object.keys(defaults).reduce((acc, key) => {
    acc[key as keyof T] = (searchParams.get(key) ?? defaults[key as keyof T]) as T[keyof T];
    return acc;
  }, {} as T);

  // Update multiple parameters atomically
  const setState = (updates: Partial<T>) => {
    const next: Record<string, string> = Object.assign(
      {},
      [...searchParams.entries()].reduce(
        (o, [key, value]) => ({ ...o, [key]: value }),
        {} as Record<string, string>
      ),
      updates
    );
    setSearchParams(next);
  };

  return [state, setState];
}
