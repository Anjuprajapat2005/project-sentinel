'use client';

import { useState, useEffect, useCallback } from 'react';

export interface Incident {
  id: number;
  service_id: number | null;
  service_name: string;
  chaos_type: string;
  target_file: string | null;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: string;
  rollback_available: number;
  original_content: string | null;
  timestamp: string;
  created_at: string;
}

export interface Service {
  id: number;
  name: string;
  port: number;
  status: string;
  last_health_check: string | null;
  created_at: string;
  updated_at: string;
}

export interface Stats {
  total: number;
  active: number;
  bySeverity: { severity: string; count: number }[];
  byService: { service_name: string; count: number }[];
  byType: { chaos_type: string; count: number }[];
}

export function useIncidents(status?: 'active' | 'all') {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIncidents = useCallback(async () => {
    try {
      setLoading(true);
      const url = status === 'active' ? '/api/incidents?status=active' : '/api/incidents';
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setIncidents(json.data);
      } else {
        setError(json.error);
      }
    } catch (err) {
      setError('Failed to fetch incidents');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 5000);
    return () => clearInterval(interval);
  }, [fetchIncidents]);

  return { incidents, loading, error, refetch: fetchIncidents };
}

export function useServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/services');
      const json = await res.json();
      if (json.success) {
        setServices(json.data);
      } else {
        setError(json.error);
      }
    } catch (err) {
      setError('Failed to fetch services');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  return { services, loading, error, refetch: fetchServices };
}

export function useStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/stats');
      const json = await res.json();
      if (json.success) {
        setStats(json.data);
      } else {
        setError(json.error);
      }
    } catch (err) {
      setError('Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}
