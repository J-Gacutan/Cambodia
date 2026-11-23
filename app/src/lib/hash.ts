import { useEffect, useState } from "react";

/** The location hash, kept current on hashchange. `fallback` stands in for an empty hash. */
export function useHash(fallback: string): string {
  const [hash, setHash] = useState(() => window.location.hash || fallback);
  useEffect(() => {
    const on = () => setHash(window.location.hash || fallback);
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, [fallback]);
  return hash;
}

export const hashPath = (hash: string) => hash.replace(/^#/, "").split("?")[0];

export const hashQuery = (hash: string) => new URLSearchParams(hash.split("?")[1] ?? "");
