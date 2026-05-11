import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';

import { createLogger } from '@sentinel/shared';

const logger = createLogger('chaos-monkey');

const PROJECT_ROOT = process.cwd();
const LOG_DIR = path.join(PROJECT_ROOT, 'logs', 'chaos');
const DB_DIR = path.join(PROJECT_ROOT, 'database');
const DB_PATH = path.join(DB_DIR, 'sentinel.json');

mkdirSync(LOG_DIR, { recursive: true });
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
  ];

  return {
    services: initialServices,
    incidents: [],
    nextServiceId: 4,
    nextIncidentId: 1,
  };
}

function saveDb(db: Database): void {
  writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

interface ChaosTarget {
  service: string;
  port: number;
  files: string[];
}

const targets: ChaosTarget[] = [
  { service: 'auth-service', port: 4001, files: ['src/routes/auth.ts', 'src/index.ts', 'src/middleware/auth.ts'] },
  { service: 'payment-service', port: 4002, files: ['src/routes/payments.ts', 'src/index.ts', 'src/utils/validator.ts'] },
  { service: 'notification-service', port: 4003, files: ['src/routes/notifications.ts', 'src/index.ts', 'src/utils/logger.ts'] },
];

interface ChaosType {
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  inject: (target: ChaosTarget) => ChaosResult;
}

interface ChaosResult {
  success: boolean;
  file?: string;
  backup?: string;
  description: string;
  canRollback: boolean;
  originalContent?: string;
}

const chaosTypes: ChaosType[] = [
  {
    name: 'syntax_error',
    description: 'Injects syntax error causing compilation failure',
    severity: 'critical',
    inject: (target) => {
      const file = target.files[Math.floor(Math.random() * target.files.length)];
      return injectSyntaxError(target.service, file);
    },
  },
  {
    name: 'logic_bug',
    description: 'Introduces logic bug causing incorrect behavior',
    severity: 'high',
    inject: (target) => {
      const file = target.files[Math.floor(Math.random() * target.files.length)];
      return injectLogicBug(target.service, file);
    },
  },
  {
    name: 'deleted_dependency',
    description: 'Removes required dependency from package.json',
    severity: 'critical',
    inject: (target) => injectDeletedDependency(target.service),
  },
  {
    name: 'invalid_json',
    description: 'Corrupts JSON configuration file',
    severity: 'high',
    inject: (target) => injectInvalidJson(target.service),
  },
  {
    name: 'type_mismatch',
    description: 'Introduces TypeScript type mismatch',
    severity: 'medium',
    inject: (target) => {
      const file = target.files[Math.floor(Math.random() * target.files.length)];
      return injectTypeMismatch(target.service, file);
    },
  },
];

function injectSyntaxError(service: string, file: string): ChaosResult {
  try {
    const basePath = `apps/services/${service}`;
    const filePath = path.join(PROJECT_ROOT, basePath, file);
    const content = readFileSync(filePath, 'utf-8');
    const backupPath = `${filePath}.chaos-backup`;

    writeFileSync(backupPath, content);

    const lines = content.split('\n');
    const targetLine = Math.floor(Math.random() * (lines.length - 5)) + 3;

    const chaosMarkers = [
      "  // inject: unterminated string';\n",
      "  const x = {\n",
      "  missing = ;\n",
      "  func(;\n",
    ];
    const marker = chaosMarkers[Math.floor(Math.random() * chaosMarkers.length)];
    lines.splice(targetLine, 0, marker);

    writeFileSync(filePath, lines.join('\n'));

    logger.error('Chaos injected: Syntax error', { service, file, line: targetLine });

    return {
      success: true,
      file: `${basePath}/${file}`,
      backup: backupPath,
      description: `Syntax error injected at line ${targetLine} in ${file}`,
      canRollback: true,
      originalContent: content,
    };
  } catch (err) {
    logger.error('Failed to inject syntax error', { error: (err as Error).message });
    return { success: false, description: `Failed: ${(err as Error).message}`, canRollback: false };
  }
}

function injectLogicBug(service: string, file: string): ChaosResult {
  try {
    const basePath = `apps/services/${service}`;
    const filePath = path.join(PROJECT_ROOT, basePath, file);
    const content = readFileSync(filePath, 'utf-8');
    const backupPath = `${filePath}.chaos-backup`;

    writeFileSync(backupPath, content);

    const bugs = [
      { from: /if\s*\([^)]+\)\s*{/g, to: 'if (false) {' },
      { from: /\.\s*filter/g, to: '.filter().length > 999999' },
      { from: /return\s+(true|false)/g, to: 'return $1 === $1' },
      { from: /\+\s*1/g, to: '+ 9999' },
      { from: /===/g, to: '!==' },
      { from: /status:\s*['"](pending|sent|completed)['"]/g, to: "status: 'failed'" },
    ];

    let modified = content;
    const bug = bugs[Math.floor(Math.random() * bugs.length)];

    if (bug.from.test(modified)) {
      modified = modified.replace(bug.from, bug.to);
      writeFileSync(filePath, modified);
      logger.warn('Chaos injected: Logic bug', { service, file });

      return {
        success: true,
        file: `${basePath}/${file}`,
        backup: backupPath,
        description: `Logic bug injected in ${file}`,
        canRollback: true,
        originalContent: content,
      };
    }

    return { success: false, description: 'No suitable injection point found', canRollback: false };
  } catch (err) {
    return { success: false, description: `Failed: ${(err as Error).message}`, canRollback: false };
  }
}

function injectDeletedDependency(service: string): ChaosResult {
  try {
    const basePath = `apps/services/${service}`;
    const pkgPath = path.join(PROJECT_ROOT, basePath, 'package.json');
    const content = readFileSync(pkgPath, 'utf-8');
    const backupPath = `${pkgPath}.chaos-backup`;

    writeFileSync(backupPath, content);

    const pkg = JSON.parse(content);
    const deps = Object.keys(pkg.dependencies || {});

    if (deps.length === 0) {
      return { success: false, description: 'No dependencies to delete', canRollback: false };
    }

    const targetDep = deps[Math.floor(Math.random() * deps.length)];
    delete pkg.dependencies[targetDep];

    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

    logger.error('Chaos injected: Dependency deleted', { service, dependency: targetDep });

    return {
      success: true,
      file: `${basePath}/package.json`,
      backup: backupPath,
      description: `Deleted dependency: ${targetDep} from ${service}`,
      canRollback: true,
      originalContent: content,
    };
  } catch (err) {
    return { success: false, description: `Failed: ${(err as Error).message}`, canRollback: false };
  }
}

function injectInvalidJson(service: string): ChaosResult {
  try {
    const basePath = `apps/services/${service}`;
    const configFiles = ['tsconfig.json', 'package.json'];
    const file = configFiles[Math.floor(Math.random() * configFiles.length)];
    const filePath = path.join(PROJECT_ROOT, basePath, file);
    const content = readFileSync(filePath, 'utf-8');
    const backupPath = `${filePath}.chaos-backup`;

    writeFileSync(backupPath, content);

    const corruptionTypes = [
      () => `{${content.slice(1, -1).replace(/"/g, "'")}}`,
      () => content.slice(0, Math.floor(content.length / 2)),
      () => content.replace(/[,\n]/g, ' '),
    ];

    const corrupted = corruptionTypes[Math.floor(Math.random() * corruptionTypes.length)]();
    writeFileSync(filePath, corrupted);

    logger.error('Chaos injected: Invalid JSON', { service, file });

    return {
      success: true,
      file: `${basePath}/${file}`,
      backup: backupPath,
      description: `Corrupted ${file} with invalid JSON`,
      canRollback: true,
      originalContent: content,
    };
  } catch (err) {
    return { success: false, description: `Failed: ${(err as Error).message}`, canRollback: false };
  }
}

function injectTypeMismatch(service: string, file: string): ChaosResult {
  try {
    const basePath = `apps/services/${service}`;
    const filePath = path.join(PROJECT_ROOT, basePath, file);
    const content = readFileSync(filePath, 'utf-8');
    const backupPath = `${filePath}.chaos-backup`;

    writeFileSync(backupPath, content);

    const typeMismatches = [
      { from: /:\s*string/g, to: ': number' },
      { from: /:\s*number/g, to: ': boolean' },
      { from: /:\s*boolean/g, to: ': string' },
      { from: /:\s*Request/g, to: ': Response' },
      { from: /:\s*Response/g, to: ': Request' },
    ];

    let modified = content;
    const mismatch = typeMismatches[Math.floor(Math.random() * typeMismatches.length)];

    if (mismatch.from.test(modified)) {
      modified = modified.replace(mismatch.from, mismatch.to);
      writeFileSync(filePath, modified);
      logger.warn('Chaos injected: Type mismatch', { service, file });

      return {
        success: true,
        file: `${basePath}/${file}`,
        backup: backupPath,
        description: `Type mismatch injected in ${file}`,
        canRollback: true,
        originalContent: content,
      };
    }

    return { success: false, description: 'No suitable injection point found', canRollback: false };
  } catch (err) {
    return { success: false, description: `Failed: ${(err as Error).message}`, canRollback: false };
  }
}

function logIncident(
  service: string,
  chaosType: string,
  targetFile: string | undefined,
  description: string,
  severity: string,
  canRollback: boolean,
  originalContent?: string
): number {
  const db = loadDb();

  const newIncident: Incident = {
    id: db.nextIncidentId++,
    service_id: null,
    service_name: service,
    chaos_type: chaosType,
    target_file: targetFile || null,
    description,
    severity,
    status: 'active',
    rollback_available: canRollback ? 1 : 0,
    original_content: originalContent || null,
    timestamp: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  db.incidents.push(newIncident);
  saveDb(db);

  const incidentId = newIncident.id;

  logger.info('Incident logged to database', { incidentId, service, chaosType });

  const logFile = path.join(LOG_DIR, `incident-${incidentId}.log`);
  const logContent = `
=== CHAOS MONKEY INCIDENT REPORT ===
ID: ${incidentId}
Timestamp: ${new Date().toISOString()}
Service: ${service}
Chaos Type: ${chaosType}
Target File: ${targetFile || 'N/A'}
Description: ${description}
Severity: ${severity}
Status: active
Rollback Available: ${canRollback}
=====================================
  `.trim();

  writeFileSync(logFile, logContent);

  return incidentId;
}

function rollback(incidentId: number): boolean {
  try {
    const db = loadDb();
    const incident = db.incidents.find((i) => i.id === incidentId && i.rollback_available === 1);

    if (!incident) {
      logger.error('Rollback failed: Incident not found or already rolled back', { incidentId });
      return false;
    }

    if (incident.target_file && incident.original_content) {
      const basePath = `apps/services/${incident.service_name}`;
      const filePath = path.join(PROJECT_ROOT, basePath, incident.target_file.split('/').pop()!);
      writeFileSync(filePath, incident.original_content);
    }

    incident.status = 'rolled_back';
    saveDb(db);

    logger.info('Rollback successful', { incidentId, service: incident.service_name });
    console.log(`[ROLLBACK] Successfully rolled back incident #${incidentId}`);

    return true;
  } catch (err) {
    logger.error('Rollback failed', { error: (err as Error).message });
    return false;
  }
}

function listIncidents(): void {
  const db = loadDb();
  const recentIncidents = db.incidents.slice(-20).reverse();

  console.log('\n=== CHAOS MONKEY INCIDENTS ===\n');
  console.log('ID  | Service              | Type              | Severity | Status     | Rollback');
  console.log('----|---------------------|-------------------|----------|------------|----------');

  for (const row of recentIncidents) {
    const idStr = String(row.id).padEnd(3);
    const service = String(row.service_name).padEnd(19);
    const type = String(row.chaos_type).padEnd(15);
    const sev = String(row.severity).padEnd(8);
    const stat = String(row.status).padEnd(10);
    const rollback = row.rollback_available ? 'Yes' : 'No';
    console.log(`${idStr} | ${service} | ${type} | ${sev} | ${stat} | ${rollback}`);
  }

  console.log('\n');
}

async function injectChaos(): Promise<void> {
  const target = targets[Math.floor(Math.random() * targets.length)];
  const chaosType = chaosTypes[Math.floor(Math.random() * chaosTypes.length)];

  console.log(`\n[CHAOS] Injecting ${chaosType.name} into ${target.service}...`);

  const result = chaosType.inject(target);

  if (result.success) {
    const incidentId = logIncident(
      target.service,
      chaosType.name,
      result.file,
      result.description,
      chaosType.severity,
      result.canRollback,
      result.originalContent
    );

    console.log(`[CHAOS] Incident #${incidentId} created: ${result.description}`);
    console.log(`[CHAOS] Severity: ${chaosType.severity.toUpperCase()}`);
    console.log(`[CHAOS] Rollback available: ${result.canRollback ? 'YES' : 'NO'}`);

    if (result.canRollback) {
      console.log(`[ROLLBACK] Run: chaos-monkey rollback ${incidentId}`);
    }
  } else {
    console.log(`[CHAOS] Failed: ${result.description}`);
  }
}

async function main(): Promise<void> {
  loadDb();

  console.log(`
╔═══════════════════════════════════════════╗
║         CHAOS MONKEY v1.0.0             ║
║   Randomly breaks things for science    ║
╚═══════════════════════════════════════════╝
  `);

  console.log('Targets:', targets.map((t) => `${t.service} (port ${t.port})`).join(', '));
  console.log('Chaos Types:', chaosTypes.map((c) => c.name).join(', '));
  console.log('Interval: 30 seconds\n');

  const args = process.argv.slice(2);

  if (args[0] === 'rollback' && args[1]) {
    const incidentId = parseInt(args[1], 10);
    if (isNaN(incidentId)) {
      console.error('[ERROR] Invalid incident ID');
      process.exit(1);
    }
    const success = rollback(incidentId);
    process.exit(success ? 0 : 1);
  }

  if (args[0] === 'incidents') {
    listIncidents();
    return;
  }

  if (args[0] === 'inject' && args[1]) {
    const targetService = args[1];
    const target = targets.find((t) => t.service === targetService);
    if (!target) {
      console.error(`[ERROR] Unknown service: ${targetService}`);
      console.log('Available:', targets.map((t) => t.service).join(', '));
      process.exit(1);
    }
    const chaosType = chaosTypes[Math.floor(Math.random() * chaosTypes.length)];
    console.log(`[CHAOS] Injecting ${chaosType.name} into ${target.service}...`);
    const result = chaosType.inject(target);
    if (result.success) {
      logIncident(target.service, chaosType.name, result.file, result.description, chaosType.severity, result.canRollback, result.originalContent);
      console.log(`[CHAOS] Success: ${result.description}`);
    } else {
      console.log(`[CHAOS] Failed: ${result.description}`);
    }
    return;
  }

  console.log('Commands:');
  console.log('  chaos-monkey              - Run chaos every 30 seconds');
  console.log('  chaos-monkey inject <svc> - Inject single chaos into service');
  console.log('  chaos-monkey incidents   - List recent incidents');
  console.log('  chaos-monkey rollback <id> - Rollback an incident\n');

  await injectChaos();

  setInterval(injectChaos, 30000);
}

main().catch((err) => {
  logger.error('Chaos Monkey crashed', { error: err.message });
  console.error('[FATAL]', err);
  process.exit(1);
});
