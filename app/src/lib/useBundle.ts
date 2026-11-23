import { useEffect, useState } from "react";

/** `absent` when the loader resolves null: the file is not in this data version. */
export type Loaded<T> = { data?: T; absent?: boolean; error?: string };

/** The bundle is immutable per version, so one fetch per mount is enough. */
export function useBundle<T>(loader: () => Promise<T | null>): Loaded<T> {
  const [state, setState] = useState<Loaded<T>>({});
  useEffect(() => {
    let live = true;
    loader()
      .then((data) => live && setState(data === null ? { absent: true } : { data }))
      .catch((error: unknown) => live && setState({ error: String(error) }));
    return () => {
      live = false;
    };
  }, [loader]);
  return state;
}
