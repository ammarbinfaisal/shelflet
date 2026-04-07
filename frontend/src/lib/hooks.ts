import { useRef } from "react";

/** Run a callback once on mount (StrictMode-safe). */
export function useMountEffect(fn: () => unknown) {
  const called = useRef(false);
  if (!called.current) {
    called.current = true;
    fn();
  }
}
