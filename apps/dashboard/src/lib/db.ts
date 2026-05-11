import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';

const DB_DIR = path.join(process.cwd(), '..', 'database');
const DB_PATH = path.join(DB_DIR, 'sentinel.json');

mkdirSync(DB_DIR, { recursive: true });

interface Service {
  id: number;
  name: string;
  port: number;
  status: string;
  last_health_check: string | null;
  created_at: string;
  updated_at: string;
}

interface Incident {
  id: number;
  service_id: number | null;
  service_name: string;
  chaos_type: string;
  target_file: string | null;
  description: string;
  severity: string;
  status: string;
  rollback_available: number;
  original_content: string | null;
  timestamp: string;
  created_at: string;
}

interface Database {
  services: Service[];
  incidents: Incident[];
  nextServiceId: number;
  nextIncidentId: number;
}

function loadDb(): Database {
  if (existsSync(DB_PATH)) {
    return JSON.parse(readFileSync(DB_PATH, 'utf-8'));
  }

  const initialServices: Service[] = [
    { id: 1, name: 'auth-service', port: 4001, status: 'unknown', last_health_check: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 2, name: 'payment-service', port: 4002, status: 'unknown', last_health_check: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 3, name: 'notification-service', port: 4003, status: 'unknown', last_health_check: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 4, name: 'api-gateway', port: 3001, status: 'unknown', last_health_check: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ];

  return {
    services: initialServices,
    incidents: [],
    nextServiceId: 5,
    nextIncidentId: 1,
  };
}

function saveDb(data: Database): void {
  writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

export async function getAllIncidents(limit = 50): Promise<Incident[]> {
  const db = loadDb();
  return db.incidents.slice(0, limit).reverse();
}

export async function getActiveIncidents(): Promise<Incident[]> {
  const db = loadDb();
  return db.incidents.filter((i) => i.status === 'active');
}

export async function createIncident(incident: Omit<Incident, 'id' | 'created_at'>): Promise<number> {
  const db = loadDb();
  const newIncident: Incident = {
    ...incident,
    id: db.nextIncidentId++,
    created_at: new Date().toISOString(),
  };
  db.incidents.push(newIncident);
  saveDb(db);
  return newIncident.id;
}

export async function resolveIncident(id: number): Promise<void> {
  const db = loadDb();
  const incident = db.incidents.find((i) => i.id === id);
  if (incident) {
    incident.status = 'resolved';
    saveDb(db);
  }
}

export async function getAllServices(): Promise<Service[]> {
  const db = loadDb();
  return db.services.sort((a, b) => a.name.localeCompare(b.name));
}

export async function updateServiceStatus(name: string, status: string): Promise<void> {
  const db = loadDb();
  const service = db.services.find((s) => s.name === name);
  if (service) {
    service.status = status;
    service.last_health_check = new Date().toISOString();
    service.updated_at = new Date().toISOString();
    saveDb(db);
  }
}

export async function getIncidentStats() {
  const db = loadDb();

  const total = db.incidents.length;
  const active = db.incidents.filter((i) => i.status === 'active').length;

  const severityMap = new Map<string, number>();
  const serviceMap = new Map<string, number>();
  const typeMap = new Map<string, number>();

  for (const incident of db.incidents) {
    severityMap.set(incident.severity, (severityMap.get(incident.severity) || 0) + 1);
    serviceMap.set(incident.service_name, (serviceMap.get(incident.service_name) || 0) + 1);
    typeMap.set(incident.chaos_type, (typeMap.get(incident.chaos_type) || 0) + 1);
  }

  return {
    total,
    active,
    bySeverity: Array.from(severityMap.entries()).map(([severity, count]) => ({ severity, count })),
    byService: Array.from(serviceMap.entries()).map(([service_name, count]) => ({ service_name, count })),
    byType: Array.from(typeMap.entries()).map(([chaos_type, count]) => ({ chaos_type, count })),
  };
}
