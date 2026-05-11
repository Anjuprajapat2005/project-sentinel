'use client';

import { useState, useEffect } from 'react';

export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}

interface UseAutoRefreshOptions {
  interval?: number;
  onRefresh?: () => void | Promise<void>;
}

export function useAutoRefresh({ interval = 30000, onRefresh }: UseAutoRefreshOptions = {}): {
  lastUpdated: Date | null;
  isRefreshing: boolean;
  refresh: () => Promise<void>;
} {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = async () => {
    setIsRefreshing(true);
    try {
      if (onRefresh) {
        await onRefresh();
      }
      setLastUpdated(new Date());
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, interval);
    return () => clearInterval(timer);
  }, [interval]);

  return { lastUpdated, isRefreshing, refresh };
}

export function useLiveValue(initialValue: number, range = 5): number {
  const [value, setValue] = useState(initialValue);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const timer = setInterval(() => {
      setValue((prev) => {
        const change = (Math.random() - 0.5) * range;
        return Math.max(0, Math.min(100, prev + change));
      });
    }, 2000);
    return () => clearInterval(timer);
  }, [range, mounted]);

  return mounted ? value : initialValue;
}