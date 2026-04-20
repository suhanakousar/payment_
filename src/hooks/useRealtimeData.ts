'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseRealtimeDataOptions {
  interval?: number;
  enabled?: boolean;
  credentials?: RequestCredentials;
}

interface UseRealtimeDataResult<T> {
  data: T | null;
  isLoading: boolean;
  isRefreshing: boolean;
  lastUpdated: Date | null;
  error: Error | null;
  refresh: () => void;
}

export function useRealtimeData<T>(
  url: string,
  options: UseRealtimeDataOptions = {}
): UseRealtimeDataResult<T> {
  const { interval = 10000, enabled = true, credentials = 'include' } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const isFirstFetch = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async (silent = false) => {
    if (!enabled) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    if (!silent) {
      if (isFirstFetch.current) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
    } else {
      setIsRefreshing(true);
    }

    try {
      const res = await fetch(url, { credentials, signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success !== false) {
        setData(json.data ?? json);
        setLastUpdated(new Date());
        setError(null);
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setError(err as Error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      isFirstFetch.current = false;
    }
  }, [url, enabled, credentials]);

  useEffect(() => {
    isFirstFetch.current = true;
    fetchData(false);
  }, [fetchData]);

  useEffect(() => {
    if (!enabled || interval <= 0) return;
    const timer = setInterval(() => fetchData(true), interval);
    return () => clearInterval(timer);
  }, [fetchData, interval, enabled]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return { data, isLoading, isRefreshing, lastUpdated, error, refresh: () => fetchData(false) };
}
