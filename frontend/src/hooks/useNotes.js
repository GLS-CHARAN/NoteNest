import { useCallback, useEffect, useState } from 'react';

// Loads a page of notes and exposes loading / error / reload.
// `fetcher` is a service function such as getNotes; `params` are the filters.
export function useNotes(fetcher, params) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  // Stringify so the effect re-runs only when the filter VALUES change, not on every render.
  const key = JSON.stringify(params);

  useEffect(() => {
    let cancelled = false;   // ignore answers that arrive after the user already changed filters
    setLoading(true);
    setError(null);
    fetcher(JSON.parse(key))
      .then((result) => !cancelled && setData(result))
      .catch((err) => !cancelled && setError(err))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [fetcher, key, reloadToken]);

  const reload = useCallback(() => setReloadToken((n) => n + 1), []);
  return { data, loading, error, reload };
}
