'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

interface UseWebSocketOptions {
  url: string;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

const FALLBACK_TIMEOUT = 5000;

const sharedSendRef: { current: ((data: object) => void) | null } = { current: null };

export function useWebSocket({
  url,
  onMessage,
  onConnect,
  onDisconnect,
  reconnectInterval = 3000,
  maxReconnectAttempts = 10,
}: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connectionTimedOut, setConnectionTimedOut] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    timeoutRef.current = setTimeout(() => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        setConnectionTimedOut(true);
      }
    }, FALLBACK_TIMEOUT);

    try {
      wsRef.current = new WebSocket(url);

      wsRef.current.onopen = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsConnected(true);
        setError(null);
        setConnectionTimedOut(false);
        reconnectAttemptsRef.current = 0;
        onConnect?.();
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          setLastMessage(message);
          onMessage?.(message);
        } catch (e) {
          console.error('Failed to parse message:', e);
        }
      };

      wsRef.current.onclose = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsConnected(false);
        onDisconnect?.();

        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          reconnectTimeoutRef.current = setTimeout(connect, reconnectInterval);
        }
      };

      wsRef.current.onerror = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setError('WebSocket connection error');
        setConnectionTimedOut(true);
      };
    } catch (e) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setError((e as Error).message);
      setConnectionTimedOut(true);
    }
  }, [url, onMessage, onConnect, onDisconnect, reconnectInterval, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    reconnectAttemptsRef.current = maxReconnectAttempts;
    wsRef.current?.close();
  }, [maxReconnectAttempts]);

  const send = useCallback((data: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  sharedSendRef.current = send;

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { isConnected, lastMessage, error, send, disconnect, connect, connectionTimedOut };
}

interface LiveData {
  services: any[];
  incidents: any[];
  logs: any[];
  metrics: any[];
  stats: any;
}

const FALLBACK_SERVICES = [
  { id: 1, name: 'auth-service', port: 4001, status: 'healthy', last_health_check: new Date().toISOString() },
  { id: 2, name: 'payment-service', port: 4002, status: 'healthy', last_health_check: new Date().toISOString() },
  { id: 3, name: 'notification-service', port: 3003, status: 'healthy', last_health_check: new Date().toISOString() },
  { id: 4, name: 'monitoring-service', port: 3004, status: 'healthy', last_health_check: new Date().toISOString() },
  { id: 5, name: 'api-gateway', port: 4000, status: 'healthy', last_health_check: new Date().toISOString() },
];

const FALLBACK_INCIDENTS: any[] = [];

const FALLBACK_LOGS = [
  { id: 1, service: 'auth-service', level: 'INFO', message: 'Service started successfully', metadata: null, timestamp: new Date().toISOString() },
  { id: 2, service: 'payment-service', level: 'INFO', message: 'Service started successfully', metadata: null, timestamp: new Date().toISOString() },
  { id: 3, service: 'notification-service', level: 'INFO', message: 'Service started successfully', metadata: null, timestamp: new Date().toISOString() },
  { id: 4, service: 'monitoring-service', level: 'INFO', message: 'Service started successfully', metadata: null, timestamp: new Date().toISOString() },
  { id: 5, service: 'api-gateway', level: 'INFO', message: 'Service started successfully', metadata: null, timestamp: new Date().toISOString() },
];

const FALLBACK_METRICS: any[] = [];

const FALLBACK_STATS = {
  total_incidents: 0,
  active_incidents: 0,
  critical_incidents: 0,
  resolved_incidents: 0,
};

export function useLiveData() {
  const [data, setData] = useState<LiveData>({
    services: FALLBACK_SERVICES,
    incidents: FALLBACK_INCIDENTS,
    logs: FALLBACK_LOGS,
    metrics: FALLBACK_METRICS,
    stats: FALLBACK_STATS,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'connected':
        sharedSendRef.current?.({ action: 'getAll' });
        break;
      case 'initial_data':
        setData({
          services: message.services || FALLBACK_SERVICES,
          incidents: message.incidents || FALLBACK_INCIDENTS,
          logs: message.logs || FALLBACK_LOGS,
          metrics: message.metrics || FALLBACK_METRICS,
          stats: message.stats || FALLBACK_STATS,
        });
        setLoading(false);
        break;
      case 'update':
        sharedSendRef.current?.({ action: 'getAll' });
        break;
    }
  }, []);

  const { isConnected, connectionTimedOut, send } = useWebSocket({
    url: 'ws://localhost:8080',
    onMessage: handleMessage,
  });

  useEffect(() => {
    if (connectionTimedOut) {
      setLoading(false);
    }
  }, [connectionTimedOut]);

  const refresh = useCallback(() => {
    sharedSendRef.current?.({ action: 'getAll' });
  }, []);

  return { data, loading, error, isConnected, refresh };
}

export function useIncidents() {
  const [incidents, setIncidents] = useState<any[]>(FALLBACK_INCIDENTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMessage = useCallback((message: WebSocketMessage) => {
    if (message.type === 'connected') {
      sharedSendRef.current?.({ action: 'query', sql: 'SELECT * FROM incidents ORDER BY timestamp DESC LIMIT 50', table: 'incidents' });
    }
    if (message.type === 'query_result' && message.table === 'incidents') {
      setIncidents(message.data || FALLBACK_INCIDENTS);
      setLoading(false);
    }
    if (message.type === 'initial_data' && message.incidents) {
      setIncidents(message.incidents);
      setLoading(false);
    }
  }, []);

  const { isConnected, connectionTimedOut } = useWebSocket({
    url: 'ws://localhost:8080',
    onMessage: handleMessage,
  });

  useEffect(() => {
    if (connectionTimedOut) {
      setLoading(false);
    }
  }, [connectionTimedOut]);

  return { incidents, loading, error, isConnected };
}

export function useServices() {
  const [services, setServices] = useState<any[]>(FALLBACK_SERVICES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMessage = useCallback((message: WebSocketMessage) => {
    if (message.type === 'connected') {
      sharedSendRef.current?.({ action: 'query', sql: 'SELECT * FROM services ORDER BY name', table: 'services' });
    }
    if (message.type === 'query_result' && message.table === 'services') {
      setServices(message.data || FALLBACK_SERVICES);
      setLoading(false);
    }
    if (message.type === 'initial_data' && message.services) {
      setServices(message.services);
      setLoading(false);
    }
  }, []);

  const { isConnected, connectionTimedOut } = useWebSocket({
    url: 'ws://localhost:8080',
    onMessage: handleMessage,
  });

  useEffect(() => {
    if (connectionTimedOut) {
      setLoading(false);
    }
  }, [connectionTimedOut]);

  return { services, loading, error, isConnected };
}

export function useLogs() {
  const [logs, setLogs] = useState<any[]>(FALLBACK_LOGS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMessage = useCallback((message: WebSocketMessage) => {
    if (message.type === 'connected') {
      sharedSendRef.current?.({ action: 'query', sql: 'SELECT * FROM logs ORDER BY timestamp DESC LIMIT 100', table: 'logs' });
    }
    if (message.type === 'initial_data' && message.logs) {
      setLogs(message.logs);
      setLoading(false);
    }
    if (message.type === 'query_result' && message.table === 'logs') {
      setLogs(message.data || FALLBACK_LOGS);
    }
  }, []);

  const { isConnected, connectionTimedOut } = useWebSocket({
    url: 'ws://localhost:8080',
    onMessage: handleMessage,
  });

  useEffect(() => {
    if (connectionTimedOut) {
      setLoading(false);
    }
  }, [connectionTimedOut]);

  return { logs, loading, error, isConnected };
}

export function useMetrics() {
  const [metrics, setMetrics] = useState<any[]>(FALLBACK_METRICS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMessage = useCallback((message: WebSocketMessage) => {
    if (message.type === 'connected') {
      sharedSendRef.current?.({ action: 'query', sql: 'SELECT * FROM metrics ORDER BY timestamp DESC LIMIT 100', table: 'metrics' });
    }
    if (message.type === 'initial_data' && message.metrics) {
      setMetrics(message.metrics);
      setLoading(false);
    }
    if (message.type === 'query_result' && message.table === 'metrics') {
      setMetrics(message.data || FALLBACK_METRICS);
    }
  }, []);

  const { isConnected, connectionTimedOut } = useWebSocket({
    url: 'ws://localhost:8080',
    onMessage: handleMessage,
  });

  useEffect(() => {
    if (connectionTimedOut) {
      setLoading(false);
    }
  }, [connectionTimedOut]);

  return { metrics, loading, error, isConnected };
}

export function useStats() {
  const [stats, setStats] = useState<any>(FALLBACK_STATS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMessage = useCallback((message: WebSocketMessage) => {
    if (message.type === 'initial_data' && message.stats) {
      setStats(message.stats[0] || FALLBACK_STATS);
      setLoading(false);
    }
  }, []);

  const { isConnected, connectionTimedOut } = useWebSocket({
    url: 'ws://localhost:8080',
    onMessage: handleMessage,
  });

  useEffect(() => {
    if (connectionTimedOut) {
      setLoading(false);
    }
  }, [connectionTimedOut]);

  return { stats, loading, error, isConnected };
}

export function useAgents() {
  const [agents, setAgents] = useState<any>({
    alpha: { name: 'Alpha', role: 'debugger', status: 'idle', current_task: null },
    beta: { name: 'Beta', role: 'qa', status: 'idle', current_task: null },
    gamma: { name: 'Gamma', role: 'incident_manager', status: 'idle', current_task: null }
  });
  const [reports, setReports] = useState<any[]>([]);
  const [isAutonomous, setIsAutonomous] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleMessage = useCallback((message: WebSocketMessage) => {
    if (message.type === 'agent_status') {
      setAgents(message);
      setLoading(false);
    }
    if (message.type === 'autonomous_started') {
      setIsAutonomous(true);
      setAgents((prev: any) => ({ ...prev, gamma: message.agentStatus }));
    }
    if (message.type === 'autonomous_stopped') {
      setIsAutonomous(false);
      setAgents((prev: any) => ({ ...prev, gamma: message.agentStatus }));
    }
    if (message.type === 'reports') {
      setReports(message.data || []);
    }
    if (message.type === 'incident_resolved') {
      sharedSendRef.current?.({ action: 'getAgentStatus' });
      sharedSendRef.current?.({ action: 'getReports' });
    }
  }, []);

  const { isConnected, connectionTimedOut } = useWebSocket({
    url: 'ws://localhost:8080',
    onMessage: handleMessage,
  });

  useEffect(() => {
    if (connectionTimedOut) {
      setLoading(false);
    }
  }, [connectionTimedOut]);

  const fetchAgentStatus = useCallback(() => {
    sharedSendRef.current?.({ action: 'getAgentStatus' });
  }, []);

  const startAutonomous = useCallback((interval = 30000) => {
    sharedSendRef.current?.({ action: 'startAutonomous', task: { interval } });
  }, []);

  const stopAutonomous = useCallback(() => {
    sharedSendRef.current?.({ action: 'stopAutonomous' });
  }, []);

  const resolveIncident = useCallback((incidentId: number) => {
    sharedSendRef.current?.({ action: 'resolveIncident', task: { incidentId } });
  }, []);

  const fetchReports = useCallback((limit = 20) => {
    sharedSendRef.current?.({ action: 'getReports', task: { limit } });
  }, []);

  useEffect(() => {
    fetchAgentStatus();
    fetchReports();
  }, [fetchAgentStatus, fetchReports]);

  return { agents, reports, isAutonomous, loading, isConnected, fetchAgentStatus, startAutonomous, stopAutonomous, resolveIncident, fetchReports };
}

export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}