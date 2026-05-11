/**
 * MCP Server for Project Sentinel
 * Provides HTTP-based database access for Claude Code MCP integration
 * Works without external dependencies by using JSON file storage
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const DB_PATH = join(PROJECT_ROOT, 'database', 'sentinel.json');
const LOGS_DIR = join(PROJECT_ROOT, 'logs');

// Ensure directories exist
mkdirSync(join(PROJECT_ROOT, 'database'), { recursive: true });
mkdirSync(LOGS_DIR, { recursive: true });

function loadDb() {
  if (existsSync(DB_PATH)) {
    try {
      return JSON.parse(readFileSync(DB_PATH, 'utf-8'));
    } catch {
      return getDefaultDb();
    }
  }
  return getDefaultDb();
}

function getDefaultDb() {
  return {
    services: [
      { id: 1, name: 'API Gateway', port: 4000, status: 'healthy', last_health_check: new Date().toISOString() },
      { id: 2, name: 'auth-service', port: 4001, status: 'healthy', last_health_check: new Date().toISOString() },
      { id: 3, name: 'payment-service', port: 4002, status: 'healthy', last_health_check: new Date().toISOString() },
      { id: 4, name: 'notification-service', port: 4003, status: 'healthy', last_health_check: new Date().toISOString() },
      { id: 5, name: 'monitoring-service', port: 4004, status: 'healthy', last_health_check: new Date().toISOString() },
    ],
    incidents: [],
    agents: [
      { id: 1, name: 'Alpha', role: 'debugger', status: 'idle', current_task: null, last_active: new Date().toISOString() },
      { id: 2, name: 'Beta', role: 'qa', status: 'idle', current_task: null, last_active: new Date().toISOString() },
      { id: 3, name: 'Gamma', role: 'incident_manager', status: 'idle', current_task: null, last_active: new Date().toISOString() },
    ],
    logs: []
  };
}

function saveDb(db) {
  writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

async function checkServiceHealth(port) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const response = await fetch(`http://localhost:${port}/health`, { signal: controller.signal });
    clearTimeout(timeout);
    return response.ok ? 'healthy' : 'critical';
  } catch {
    return 'critical';
  }
}

async function pollServices(db) {
  for (const service of db.services) {
    const status = await checkServiceHealth(service.port);
    if (service.status !== status) {
      service.status = status;
      service.last_health_check = new Date().toISOString();

      if (status === 'critical' && !db.incidents.some(i => i.service_name === service.name && i.status === 'active')) {
        db.incidents.push({
          id: db.incidents.length + 1,
          service_id: service.id,
          service_name: service.name,
          chaos_type: 'health_check_failed',
          description: `Service ${service.name} failed health check`,
          severity: 'critical',
          status: 'active',
          timestamp: new Date().toISOString()
        });
      }
    }
  }
  saveDb(db);
  return db;
}

const server = createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url, 'http://localhost');
  const action = url.searchParams.get('action');

  try {
    if (req.method === 'GET') {
      let db = loadDb();

      // Auto-poll services on each request
      db = await pollServices(db);

      if (action === 'services' || !action) {
        res.end(JSON.stringify({
          success: true,
          data: db.services,
          timestamp: new Date().toISOString()
        }));
        return;
      }

      if (action === 'incidents') {
        const status = url.searchParams.get('status') || 'active';
        const filtered = db.incidents.filter(i => i.status === status);
        res.end(JSON.stringify({
          success: true,
          data: filtered,
          count: filtered.length
        }));
        return;
      }

      if (action === 'agents') {
        res.end(JSON.stringify({
          success: true,
          data: db.agents
        }));
        return;
      }

      if (action === 'health') {
        const healthy = db.services.filter(s => s.status === 'healthy').length;
        const critical = db.services.filter(s => s.status === 'critical').length;
        res.end(JSON.stringify({
          success: true,
          data: { healthy, critical, services: db.services }
        }));
        return;
      }

      if (action === 'stats') {
        res.end(JSON.stringify({
          success: true,
          data: {
            totalServices: db.services.length,
            healthyServices: db.services.filter(s => s.status === 'healthy').length,
            activeIncidents: db.incidents.filter(i => i.status === 'active').length,
            resolvedIncidents: db.incidents.filter(i => i.status === 'resolved').length
          }
        }));
        return;
      }
    }

    if (req.method === 'POST' && url.pathname === '/update') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const { table, data } = JSON.parse(body);
          const db = loadDb();
          if (table === 'services' && data.id) {
            const idx = db.services.findIndex(s => s.id === data.id);
            if (idx >= 0) db.services[idx] = { ...db.services[idx], ...data };
          }
          saveDb(db);
          res.end(JSON.stringify({ success: true }));
        } catch (error) {
          res.writeHead(400);
          res.end(JSON.stringify({ success: false, error: error.message }));
        }
      });
      return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  } catch (error) {
    res.writeHead(500);
    res.end(JSON.stringify({ error: error.message }));
  }
});

const PORT = process.env.MCP_PORT || 3456;
server.listen(PORT, () => {
  console.log(`\n🔮 Project Sentinel MCP Server`);
  console.log(`   Running on http://localhost:${PORT}`);
  console.log(`\n📡 Available endpoints:`);
  console.log(`   GET  /?action=services   - Get all services`);
  console.log(`   GET  /?action=incidents  - Get incidents`);
  console.log(`   GET  /?action=agents     - Get agent status`);
  console.log(`   GET  /?action=health     - Get system health`);
  console.log(`   GET  /?action=stats      - Get dashboard stats`);
  console.log(`   POST /update            - Update database`);
  console.log(`\n🧪 Testing:`);
  console.log(`   curl "http://localhost:${PORT}/?action=stats"`);
  console.log(`   curl "http://localhost:${PORT}/?action=health"`);
  console.log(`\n`);
});
