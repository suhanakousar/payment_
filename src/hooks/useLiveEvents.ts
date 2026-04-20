'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export type LiveEventType = 'transaction' | 'payout' | 'dispute' | 'chargeback' | 'connected' | 'heartbeat';

export interface LiveEvent {
  type: LiveEventType;
  action?: 'created' | 'updated';
  id?: string;
  status?: string;
  amount?: number;
  gateway?: string;
  timestamp: string;
}

interface UseLiveEventsOptions {
  enabled?: boolean;
  onEvent?: (event: LiveEvent) => void;
}

export function useLiveEvents(options: UseLiveEventsOptions = {}) {
  const { enabled = true, onEvent } = options;
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const esRef = useRef<EventSource | null>(null);
  const onEventRef = useRef(onEvent);

  useEffect(() => { onEventRef.current = onEvent; }, [onEvent]);

  const connect = useCallback(() => {
    if (!enabled || typeof window === 'undefined') return;

    if (esRef.current) {
      esRef.current.close();
    }

    const es = new EventSource('/api/v1/events', { withCredentials: true });
    esRef.current = es;

    es.onopen = () => setConnected(true);

    es.onmessage = (e) => {
      try {
        const event: LiveEvent = JSON.parse(e.data);
        if (event.type === 'heartbeat') return;
        setEvents((prev) => [event, ...prev].slice(0, 50));
        onEventRef.current?.(event);
      } catch {}
    };

    es.onerror = () => {
      setConnected(false);
      es.close();
      setTimeout(connect, 5000);
    };
  }, [enabled]);

  useEffect(() => {
    connect();
    return () => {
      esRef.current?.close();
    };
  }, [connect]);

  return { connected, events };
}
