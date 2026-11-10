import { useCallback, useEffect, useState, type DependencyList } from 'react';

type AsyncState<T> = {
  data: T | null;
  error: string | null;
  loading: boolean;
  reload: () => void;
};

export function useAsyncData<T>(fetcher: () => Promise<T>, deps: DependencyList): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetcher()
      .then((result) => {
        if (active) setData(result);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        console.error('data load failed', cause);
        setError(cause instanceof Error ? cause.message : 'Something went wrong. Please try again.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version]);

  const reload = useCallback(() => setVersion((current) => current + 1), []);

  return { data, error, loading, reload };
}
