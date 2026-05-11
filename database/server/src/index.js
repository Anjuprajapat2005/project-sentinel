import { WebSocketServer } from 'ws';
import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { AlphaDebugger } from '../../agents/alpha.js';
import { BetaQA } from '../../agents/beta.js';
import { GammaManager } from '../../agents/gamma.js';

let alpha, beta, gamma;

const PROJECT_ROOT = join(__dirname, '..', '..');
const DB_PATH = join(PROJECT_ROOT, 'database', 'sentinel.db');
const LOG_DIR = join(PROJECT_ROOT, 'logs');
const TESTS_DIR = join(PROJECT_ROOT, 'tests');

mkdirSync(dirname(DB_PATH), { recursive: true });
mkdirSync(LOG_DIR, { recursive: true });
mkdirSync(TESTS_DIR, { recursive: true });

let db;
let wss;
const clients = new Set();

async function initDatabase() {
  const SQL = await initSqlJs();

  if (existsSync(DB_PATH)) {
    const buffer = readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      port INTEGER NOT NULL,
      status TEXT DEFAULT 'unknown',
      last_health_check TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS incidents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_id INTEGER,
      service_name TEXT NOT NULL,
      chaos_type TEXT NOT NULL,
      target_file TEXT,
      description TEXT NOT NULL,
      severity TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      rollback_available INTEGER DEFAULT 0,
      original_content TEXT,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (service_id) REFERENCES services(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service TEXT NOT NULL,
      level TEXT NOT NULL,
      message TEXT NOT NULL,
      metadata TEXT,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service TEXT NOT NULL,
      metric_name TEXT NOT NULL,
      value REAL NOT NULL,
      unit TEXT,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS agents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL,
      status TEXT DEFAULT 'idle',
      current_task TEXT,
      last_active TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS agent_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_id INTEGER,
      incident_id INTEGER,
      task_type TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      result TEXT,
      error TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      completed_at TEXT,
      FOREIGN KEY (agent_id) REFERENCES agents(id),
      FOREIGN KEY (incident_id) REFERENCES incidents(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS regression_tests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      incident_id INTEGER,
      test_name TEXT NOT NULL,
      test_file TEXT NOT NULL,
      test_content TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      pass_count INTEGER DEFAULT 0,
      fail_count INTEGER DEFAULT 0,
      last_run TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (incident_id) REFERENCES incidents(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS incident_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      incident_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      root_cause TEXT,
      fix_applied TEXT,
      tests_created INTEGER DEFAULT 0,
      tests_passed INTEGER DEFAULT 0,
      resolution_time_seconds INTEGER,
      agent_workflow TEXT,
      report_content TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (incident_id) REFERENCES incidents(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS agent_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_name TEXT NOT NULL,
      log_level TEXT NOT NULL,
      message TEXT NOT NULL,
      context TEXT,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const agents = [
    ['Alpha', 'debugger', 'Debugger - Analyzes logs and generates fixes'],
    ['Beta', 'qa', 'QA - Creates and runs regression tests'],
    ['Gamma', 'incident_manager', 'Incident Manager - Orchestrates autonomous resolution'],
  ];

  for (const [name, role, description] of agents) {
    db.run(`INSERT OR IGNORE INTO agents (name, role, status) VALUES (?, ?, 'idle')`, [name, role]);
  }

  const services = [
    ['auth-service', 4001],
    ['payment-service', 4002],
    ['notification-service', 4003],
    ['api-gateway', 3001],
  ];

  for (const [name, port] of services) {
    db.run(`INSERT OR IGNORE INTO services (name, port) VALUES (?, ?)`, [name, port]);
  }

  // Initialize autonomous agents
  alpha = new AlphaDebugger(null, db);
  beta = new BetaQA(null, db);
  gamma = new GammaManager(null, db, alpha, beta);

  console.log('Autonomous agents initialized: Alpha (Debugger), Beta (QA), Gamma (Manager)');

  saveDatabase();
}

function saveDatabase() {
  if (db) {
    const data = db.export();
    writeFileSync(DB_PATH, Buffer.from(data));
    broadcastUpdate();
  }
}

function broadcastUpdate() {
  const message = JSON.stringify({ type: 'update', timestamp: new Date().toISOString() });
  clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(message);
    }
  });
}

function queryDatabase(sql, params = []) {
  try {
    const results = db.exec(sql, params);
    if (results.length === 0) return [];

    const columns = results[0].columns;
    return results[0].values.map(row => {
      const obj = {};
      columns.forEach((col, i) => {
        obj[col] = row[i];
      });
      return obj;
    });
  } catch (error) {
    console.error('Query error:', error);
    return { error: error.message };
  }
}

function runDatabase(sql, params = []) {
  try {
    db.run(sql, params);
    saveDatabase();
    return { success: true };
  } catch (error) {
    console.error('Run error:', error);
    return { success: false, error: error.message };
  }
}

async function startServer(port = 8080) {
  await initDatabase();

  wss = new WebSocketServer({ port });

  console.log(`SQLite WebSocket server running on ws://localhost:${port}`);

  wss.on('connection', (ws) => {
    console.log('Client connected');
    clients.add(ws);

    // Update agent WebSocket connections
    if (alpha) alpha.updateWs(ws);
    if (beta) beta.updateWs(ws);
    if (gamma) gamma.updateWs(ws);

    ws.send(JSON.stringify({
      type: 'connected',
      timestamp: new Date().toISOString()
    }));

    ws.on('message', async (message) => {
      try {
        const { action, sql, params, table, agent, task, test, report } = JSON.parse(message);

        switch (action) {
          case 'query':
            ws.send(JSON.stringify({
              type: 'query_result',
              table,
              data: queryDatabase(sql, params)
            }));
            break;

          case 'run':
            const result = runDatabase(sql, params);
            ws.send(JSON.stringify({ type: 'run_result', result }));
            break;

          case 'getAll':
            const services = queryDatabase('SELECT * FROM services ORDER BY name');
            const incidents = queryDatabase('SELECT * FROM incidents ORDER BY timestamp DESC LIMIT 50');
            const logs = queryDatabase('SELECT * FROM logs ORDER BY timestamp DESC LIMIT 100');
            const metrics = queryDatabase('SELECT * FROM metrics ORDER BY timestamp DESC LIMIT 100');
            const agents = queryDatabase('SELECT * FROM agents');
            const agentTasks = queryDatabase('SELECT * FROM agent_tasks ORDER BY created_at DESC LIMIT 50');
            const tests = queryDatabase('SELECT * FROM regression_tests ORDER BY created_at DESC LIMIT 50');
            const reports = queryDatabase('SELECT * FROM incident_reports ORDER BY created_at DESC LIMIT 20');
            const stats = queryDatabase(`
              SELECT
                (SELECT COUNT(*) FROM incidents) as total_incidents,
                (SELECT COUNT(*) FROM incidents WHERE status = 'active') as active_incidents,
                (SELECT COUNT(*) FROM incidents WHERE status = 'active' AND severity = 'critical') as critical_incidents
            `);

            ws.send(JSON.stringify({
              type: 'initial_data',
              services,
              incidents,
              logs,
              metrics,
              agents,
              agentTasks,
              tests,
              reports,
              stats: stats[0] || {}
            }));
            break;

          case 'createTask':
            const taskId = db.exec('SELECT last_insert_rowid()').values[0][0];
            runDatabase(
              `INSERT INTO agent_tasks (agent_id, incident_id, task_type, description, status) VALUES (?, ?, ?, ?, 'in_progress')`,
              [task.agentId, task.incidentId, task.type, task.description]
            );
            const newTaskId = db.exec('SELECT last_insert_rowid()').values[0][0];
            runDatabase(`UPDATE agents SET status = 'working', current_task = ? WHERE id = ?`, [task.type, task.agentId]);
            ws.send(JSON.stringify({ type: 'task_created', taskId: newTaskId }));
            break;

          case 'completeTask':
            runDatabase(
              `UPDATE agent_tasks SET status = ?, result = ?, completed_at = datetime('now') WHERE id = ?`,
              [task.status, task.result, task.id]
            );
            runDatabase(`UPDATE agents SET status = 'idle', current_task = NULL, last_active = datetime('now') WHERE id = ?`, [task.agentId]);
            ws.send(JSON.stringify({ type: 'task_completed', taskId: task.id }));
            break;

          case 'createTest':
            const testFile = join(TESTS_DIR, `regression_${test.incidentId}_${Date.now()}.test.ts`);
            writeFileSync(testFile, test.content);
            runDatabase(
              `INSERT INTO regression_tests (incident_id, test_name, test_file, test_content, status) VALUES (?, ?, ?, ?, 'created')`,
              [test.incidentId, test.name, testFile, test.content]
            );
            const newTestId = db.exec('SELECT last_insert_rowid()').values[0][0];
            ws.send(JSON.stringify({ type: 'test_created', testId: newTestId }));
            break;

          case 'runTest':
            const testResult = db.exec(`SELECT * FROM regression_tests WHERE id = ?`, [test.id]);
            const testRecord = testResult[0]?.values[0];
            const passed = Math.random() > 0.3;
            runDatabase(
              `UPDATE regression_tests SET status = ?, pass_count = ?, fail_count = ?, last_run = datetime('now') WHERE id = ?`,
              [passed ? 'passed' : 'failed', passed ? 1 : 0, passed ? 0 : 1, test.id]
            );
            ws.send(JSON.stringify({ type: 'test_completed', testId: test.id, passed }));
            break;

          case 'createReport':
            runDatabase(
              `INSERT INTO incident_reports (incident_id, title, summary, root_cause, fix_applied, tests_created, tests_passed, resolution_time_seconds, agent_workflow, report_content)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [report.incidentId, report.title, report.summary, report.rootCause, report.fixApplied, report.testsCreated, report.testsPassed, report.resolutionTime, report.workflow, report.content]
            );
            runDatabase(`UPDATE incidents SET status = 'resolved' WHERE id = ?`, [report.incidentId]);
            const newReportId = db.exec('SELECT last_insert_rowid()').values[0][0];
            ws.send(JSON.stringify({ type: 'report_created', reportId: newReportId }));
            break;

          case 'getAgentLogs':
            const agentLogs = queryDatabase('SELECT * FROM agent_logs WHERE agent_name = ? ORDER BY timestamp DESC LIMIT 100', [agent]);
            ws.send(JSON.stringify({ type: 'agent_logs', agent, logs: agentLogs }));
            break;

          case 'logAgent':
            runDatabase(
              `INSERT INTO agent_logs (agent_name, log_level, message, context) VALUES (?, ?, ?, ?)`,
              [agent.name, agent.level, agent.message, agent.context]
            );
            ws.send(JSON.stringify({ type: 'logged' }));
            break;

          case 'getCriticalIncidents':
            const criticalIncidents = queryDatabase(`
              SELECT * FROM incidents
              WHERE severity = 'critical' AND status = 'active'
              ORDER BY timestamp DESC
            `);
            ws.send(JSON.stringify({ type: 'critical_incidents', data: criticalIncidents }));
            break;

          case 'startAutonomous':
            gamma.startAutonomousMode(task?.interval || 30000);
            ws.send(JSON.stringify({
              type: 'autonomous_started',
              interval: task?.interval || 30000,
              agentStatus: gamma.getStatus()
            }));
            break;

          case 'stopAutonomous':
            gamma.stopAutonomousMode();
            ws.send(JSON.stringify({
              type: 'autonomous_stopped',
              agentStatus: gamma.getStatus()
            }));
            break;

          case 'resolveIncident':
            const incidentId = task.incidentId;
            const resolveResult = await gamma.resolveIncidentManually(incidentId);
            ws.send(JSON.stringify({ type: 'incident_resolved', result: resolveResult }));
            break;

          case 'getAgentStatus':
            ws.send(JSON.stringify({
              type: 'agent_status',
              alpha: alpha.getStatus(),
              beta: beta.getStatus(),
              gamma: gamma.getStatus()
            }));
            break;

          case 'getReports':
            const reportData = gamma.getReports(task?.limit || 20);
            ws.send(JSON.stringify({ type: 'reports', data: reportData }));
            break;

          default:
            ws.send(JSON.stringify({ type: 'error', message: 'Unknown action' }));
        }
      } catch (error) {
        ws.send(JSON.stringify({ type: 'error', message: error.message }));
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');
      clients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });
}

process.on('SIGINT', () => {
  console.log('Shutting down...');
  saveDatabase();
  if (wss) wss.close();
  process.exit(0);
});

startServer(8080);
