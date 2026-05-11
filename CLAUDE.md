# Project Sentinel - Autonomous Incident Resolution System

## Project Overview

Project Sentinel is an autonomous incident resolution system with three AI agents that work together to detect, analyze, fix, and validate incidents in a microservices architecture.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     WebSocket Server                        │
│                    (database/server)                        │
├─────────────────────────────────────────────────────────────┤
│  Alpha (Debugger)  │  Beta (QA)      │  Gamma (Manager)    │
│  - Log analysis    │  - Test create  │  - Orchestration    │
│  - Root cause      │  - Test execute │  - Report gen        │
│  - Fix generation  │  - Validation   │  - Workflow control │
├─────────────────────────────────────────────────────────────┤
│                    SQLite Database                         │
│  - services, incidents, logs, metrics                       │
│  - agents, agent_tasks, regression_tests                    │
│  - incident_reports, agent_logs                             │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Dashboard                        │
│              (apps/dashboard - Port 3006)                   │
│  - Real-time metrics & charts                              │
│  - Agent status panel                                      │
│  - Incident management                                     │
└─────────────────────────────────────────────────────────────┘
```

## TypeScript Strict Rules

### Compiler Configuration

All TypeScript code must pass strict mode:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### Required Patterns

**Always use explicit types for function parameters and return types:**

```typescript
// Required
function processIncident(incident: Incident): Promise<ResolutionResult> {
  // ...
}

// Forbidden - implicit any
function processIncident(incident) {
  // ...
}
```

**Always enable strict null checks:**

```typescript
// Required
function getServiceStatus(serviceId: number): ServiceStatus | null {
  const service = this.query('SELECT * FROM services WHERE id = ?', [serviceId]);
  return service[0] ?? null;
}

// Forbidden - potential null reference
function getServiceStatus(serviceId: number) {
  const service = this.query('SELECT * FROM services WHERE id = ?', [serviceId]);
  return service[0]; // Could be undefined
}
```

**Use proper type guards:**

```typescript
// Required
function isValidIncident(incident: unknown): incident is Incident {
  return (
    typeof incident === 'object' &&
    incident !== null &&
    'id' in incident &&
    'service_name' in incident
  );
}

// Use guard before accessing properties
const incident = data as unknown;
if (isValidIncident(incident)) {
  console.log(incident.service_name); // TypeScript knows this is safe
}
```

**Never use `any` type:**

```typescript
// Forbidden
const data: any = getData();

// Required - use proper type or unknown
const data: unknown = getData();
// or
interface DataType { ... }
const data: DataType = getData();
```

## Incident Resolution Protocol

### Before Fixing Any Incident - MANDATORY CHECK

**CRITICAL: Always check incident-history.log before applying a fix!**

```bash
# 1. Check if this fix has been attempted before
cat docs/incident-history.log

# 2. If same chaos_type + service + fix pattern exists with "FAILED" status:
#    → Do NOT use the same approach
#    → Use Thinking Mode to find alternative
#    → Document the new attempt in CLAUDE.md patterns

# 3. If no history or previous attempts succeeded:
#    → Proceed with standard fix workflow
```

### Workflow States

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   ACTIVE    │────▶│   ANALYZING │────▶│   FIXING    │────▶│   RESOLVED  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
      │
      ▼
┌─────────────┐
│  FAILED     │ (if any step fails)
└─────────────┘
```

### Agent Responsibilities

#### Alpha (Debugger) - Role: `debugger`

**Responsibilities:**
- Analyze incident logs
- Identify error patterns
- Determine root cause
- Generate code fixes

**Methods:**
```typescript
async analyzeIncident(incident: Incident): Promise<AnalysisResult>
analyzeLogs(logs: LogEntry[]): Analysis
identifyPatterns(messages: string[]): Pattern[]
determineRootCause(patterns: Pattern[], errors: Error[]): string
generateSuggestions(patterns: Pattern[], errors: Error[]): Suggestion[]
async generateFix(incident: Incident, analysis: AnalysisResult): Promise<FixResult>
```

**Chaos Type Handlers:**
- `syntax_error` - Remove injected markers
- `logic_bug` - Revert incorrect logic
- `deleted_dependency` - Note dependency restoration requirements
- `invalid_json` - Re-parse and stringify
- `type_mismatch` - Restore type annotations

#### Beta (QA) - Role: `qa`

**Responsibilities:**
- Create regression tests
- Execute test suites
- Validate fixes

**Methods:**
```typescript
async createRegressionTests(incident: Incident, analysis: AnalysisResult): Promise<TestResult>
async runRegressionTests(incidentId: number): Promise<TestRunResult>
async getTestsForIncident(incidentId: number): Test[]
getTestStats(): TestStats
```

**Test Types by Chaos:**
- `syntax_error` → Syntax validation + TypeScript compilation tests
- `logic_bug` → Logic validation + status validation tests
- `deleted_dependency` → Dependency check + module resolution tests
- `invalid_json` → JSON validation + config schema tests
- `type_mismatch` → Type checking + type inference tests

#### Gamma (Manager) - Role: `incident_manager`

**Responsibilities:**
- Orchestrate incident resolution workflow
- Generate incident reports
- Manage autonomous mode

**Methods:**
```typescript
startAutonomousMode(intervalMs?: number): void
stopAutonomousMode(): void
async processIncidents(): Promise<void>
async resolveIncident(incident: Incident): Promise<ResolutionResult>
async resolveIncidentManually(incidentId: number): Promise<ResolutionResult>
generateReport(...): Report
async saveReport(report: Report): number
```

**Workflow Steps:**
1. Detect critical active incidents
2. Invoke Alpha to analyze and generate fix
3. Invoke Beta to create and run tests
4. Generate incident report with full workflow
5. Save report to SQLite
6. Update incident status to `resolved`
7. Broadcast resolution to connected clients

### Database Schema

```sql
-- Core tables
services (id, name, port, status, last_health_check)
incidents (id, service_id, service_name, chaos_type, target_file,
           description, severity, status, rollback_available,
           original_content, timestamp)
logs (id, service, level, message, metadata, timestamp)
metrics (id, service, metric_name, value, unit, timestamp)

-- Agent tables
agents (id, name, role, status, current_task, last_active)
agent_tasks (id, agent_id, incident_id, task_type, description,
             status, result, error, created_at, completed_at)

-- Resolution tables
regression_tests (id, incident_id, test_name, test_file, test_content,
                  status, pass_count, fail_count, last_run, created_at)
incident_reports (id, incident_id, title, summary, root_cause,
                  fix_applied, tests_created, tests_passed,
                  resolution_time_seconds, agent_workflow, report_content)
agent_logs (id, agent_name, log_level, message, context, timestamp)
```

### WebSocket Actions

| Action | Parameters | Description |
|--------|------------|-------------|
| `startAutonomous` | `task: { interval: number }` | Start Gamma's autonomous mode |
| `stopAutonomous` | - | Stop autonomous mode |
| `resolveIncident` | `task: { incidentId: number }` | Manually trigger resolution |
| `getAgentStatus` | - | Get all agent statuses |
| `getReports` | `task: { limit: number }` | Get incident reports |

## Testing Workflow

### Test Creation

Beta agent creates tests based on chaos type:

```typescript
// pattern: database/agents/beta.js
switch (chaosType) {
  case 'syntax_error':
    return this.createSyntaxTests(serviceName, targetFile);
  case 'logic_bug':
    return this.createLogicTests(serviceName, targetFile, analysis);
  case 'deleted_dependency':
    return this.createDependencyTests(serviceName);
  // ...
}
```

### Test Execution

Tests are stored in SQLite and executed via simulation:

```typescript
async runRegressionTests(incidentId: number): Promise<TestRunResult> {
  const tests = this.query(
    `SELECT * FROM regression_tests WHERE incident_id = ? AND status != 'passed'`,
    [incidentId]
  );

  for (const test of tests) {
    const result = await this.simulateTestRun(test);
    // Update status in database
  }
}
```

### Test Structure

```typescript
interface RegressionTest {
  id: number;
  incident_id: number;
  test_name: string;
  test_file: string;
  test_content: string;
  status: 'created' | 'passed' | 'failed';
  pass_count: number;
  fail_count: number;
  last_run: string;
  created_at: string;
}
```

### Running Tests

```bash
# Start WebSocket server
cd database/server && node src/index.js

# Dashboard connects automatically
# Beta agent executes tests on resolution
```

## Deployment Standards

### Environment Requirements

| Component | Port | Description |
|-----------|------|-------------|
| WebSocket Server | 8080 | SQLite + agent system |
| Dashboard | 3006 | Next.js UI |
| Auth Service | 4001 | Microservice |
| Payment Service | 4002 | Microservice |
| Notification Service | 4003 | Microservice |
| API Gateway | 3001 | Entry point |

### Start Sequence

```bash
# 1. Start WebSocket server (must be first)
cd C:\Users\praja\project-sentinel\database\server
node src/index.js

# 2. Start dashboard (in separate terminal)
cd C:\Users\praja\project-sentinel
pnpm --filter @sentinel/dashboard dev
```

### Database Persistence

- SQLite database: `database/sentinel.db`
- Auto-save on every write operation
- Backup before major operations
- Incident history: `docs/incident-history.log` (append-only)

### Health Checks

```bash
# Check WebSocket
curl -X POST -H "Content-Type: application/json" \
  -d '{"action":"getAll"}' \
  ws://localhost:8080

# Check services
SELECT * FROM services;
SELECT * FROM agents;
```

## Naming Conventions

### Files and Directories

| Type | Convention | Example |
|------|------------|---------|
| Agent files | `{agent-name}.js` | `alpha.js`, `beta.js`, `gamma.js` |
| Components | `kebab-case.tsx` | `service-status-panel.tsx` |
| Hooks | `use-{feature}.ts` | `use-websocket.ts` |
| Pages | `page.tsx` or `[slug]/page.tsx` | `overview/page.tsx` |
| Types | `{feature}-types.ts` | `incident-types.ts` |
| Services | `kebab-case` | `auth-service`, `payment-service` |

### Database Objects

| Type | Convention | Example |
|------|------------|---------|
| Tables | `snake_case` | `incident_reports`, `agent_logs` |
| Columns | `snake_case` | `service_name`, `chaos_type` |
| Indexes | `idx_{table}_{column}` | `idx_incidents_severity` |

### Code Identifiers

| Type | Convention | Example |
|------|------------|---------|
| Classes | PascalCase | `AlphaDebugger`, `BetaQA`, `GammaManager` |
| Interfaces | PascalCase | `Incident`, `ResolutionResult` |
| Methods | camelCase | `analyzeIncident`, `generateFix` |
| Constants | UPPER_SNAKE | `MAX_RETRIES`, `DEFAULT_INTERVAL` |
| Enums | PascalCase | `LogLevel.INFO`, `IncidentStatus.ACTIVE` |

### Agent Names

| Agent | Role | File | Class |
|-------|------|------|-------|
| Alpha | debugger | `database/agents/alpha.js` | `AlphaDebugger` |
| Beta | qa | `database/agents/beta.js` | `BetaQA` |
| Gamma | incident_manager | `database/agents/gamma.js` | `GammaManager` |

## Forbidden Patterns

### Code Patterns

**1. No implicit `any`:**
```typescript
// Forbidden
function process(data) { return data.id; }

// Required
function process(data: unknown): number {
  if (typeof data === 'object' && data !== null && 'id' in data) {
    return (data as { id: number }).id;
  }
  throw new Error('Invalid data');
}
```

**2. No bare `catch` without type guard:**
```typescript
// Forbidden
try { something(); }
catch (e) { console.log(e.message); }

// Required
try { something(); }
catch (e) {
  if (e instanceof Error) {
    console.log(e.message);
  }
}
```

**3. No non-null assertion without null check:**
```typescript
// Forbidden
const name = user!.name;

// Required
const name = user?.name ?? 'Unknown';
```

**4. No synchronous database operations in WebSocket handlers:**
```typescript
// Forbidden
ws.on('message', (msg) => {
  const result = db.query('SELECT * FROM large_table');
  ws.send(result);
});

// Required
ws.on('message', async (msg) => {
  const result = await queryDatabaseAsync('SELECT * FROM large_table LIMIT 100');
  ws.send(result);
});
```

**5. No direct SQL injection without parameterized queries:**
```typescript
// Forbidden
const sql = `SELECT * FROM users WHERE name = '${userInput}'`;

// Required
const sql = 'SELECT * FROM users WHERE name = ?';
const params = [userInput];
```

### Architecture Patterns

**1. No circular dependencies between agents:**
```typescript
// Forbidden - circular
// alpha.js imports beta
// beta.js imports alpha

// Required - pass dependencies via constructor
class GammaManager {
  constructor(alpha, beta) {
    this.alpha = alpha; // Injected, not imported
    this.beta = beta;
  }
}
```

**2. No agent logic in dashboard components:**
```typescript
// Forbidden - business logic in UI
function AgentPanel() {
  const alpha = new AlphaDebugger();
  const result = await alpha.analyze();
}

// Required - UI only, server handles logic
function AgentStatusPanel() {
  const { agents } = useAgents();
  // Display only
}
```

**3. No hardcoded connection strings:**
```typescript
// Forbidden
const DB_PATH = 'C:\\specific\\path\\sentinel.db';

// Required - use relative or environment
const PROJECT_ROOT = join(__dirname, '..', '..');
const DB_PATH = join(PROJECT_ROOT, 'database', 'sentinel.db');
```

**4. No blocking operations in WebSocket:**
```typescript
// Forbidden
ws.send(syncHeavyOperation());

// Required - async operations
await asyncHeavyOperation();
ws.send(result);
```

### Testing Patterns

**1. No test files in production bundle:**
```typescript
// Forbidden - test code in src/
// src/utils.ts includes test utilities

// Required - separate test files
// src/utils.ts - production code
// __tests__/utils.test.ts - tests (excluded from build)
```

**2. No mock data without documentation:**
```typescript
// Forbidden
const mockData = [1, 2, 3];

// Required - documented mock data
/**
 * Sample incident for testing resolution flow.
 * Represents a syntax_error chaos event in auth-service.
 */
const mockIncident: Incident = { ... };
```

### Git Patterns

**1. No commit with failing tests:**
```bash
# Required - verify tests pass
pnpm test
git commit -m "fix: ..."

# Forbidden
git commit -m "fix: ..." # Tests failing
```

**2. No force pushes to main:**
```bash
# Forbidden
git push --force main

# Required - create PR or use merge commit
git push origin feature/incident-flow
gh pr create --title "feat: incident resolution"
```

## Quick Reference

### Common Commands

```bash
# Start full system
cd database/server && node src/index.js &
pnpm --filter @sentinel/dashboard dev

# Check agent status
# Dashboard: http://localhost:3006 → Agent Status Panel

# Trigger manual resolution
# WebSocket: { action: 'resolveIncident', task: { incidentId: 1 } }

# Enable autonomous mode
# Dashboard: Click "Start Autonomous Mode"
# Or WebSocket: { action: 'startAutonomous', task: { interval: 30000 } }
```

## MCP Server Configuration

### SQLite MCP Setup

The Project Sentinel uses SQLite MCP for service status tracking. Configure Claude to use it:

```bash
# MCP Server Configuration (in Claude settings)
# SQLite MCP connects to: database/sentinel.db

# Available tools:
# - sql.js/query - Query the database
# - sql.js/execute - Run SQL statements

# Example: Poll service status
sql.js/query "SELECT name, status, last_health_check FROM services WHERE status = 'critical'"
```

### Service Status Polling

```bash
# Terminal command to poll service status:
# Check all services
sql.js/query "SELECT * FROM services ORDER BY status DESC"

# Check active incidents
sql.js/query "SELECT * FROM incidents WHERE status = 'active' ORDER BY severity DESC"

# Check agent status
sql.js/query "SELECT * FROM agents"
```

### GitHub MCP Integration (Optional)

For GitHub integration, add GitHub MCP to your Claude configuration:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"]
    }
  }
}
```

### MCP Workflow

```bash
# 1. Poll for critical services
sql.js/query "SELECT * FROM services WHERE status = 'critical'"

# 2. If critical found, trigger autonomous resolution
# WebSocket: { action: 'startAutonomous', task: { interval: 30000 } }

# 3. Monitor resolution via:
sql.js/query "SELECT * FROM agent_tasks WHERE status = 'in_progress'"
```

### File Locations

| File | Path |
|------|------|
| Alpha (Debugger) | `database/agents/alpha.js` |
| Beta (QA) | `database/agents/beta.js` |
| Gamma (Manager) | `database/agents/gamma.js` |
| WebSocket Server | `database/server/src/index.js` |
| Dashboard Hooks | `apps/dashboard/src/hooks/use-websocket.ts` |
| Overview Page | `apps/dashboard/src/app/overview/page.tsx` |
| Database | `database/sentinel.db` |
| Incident History | `docs/incident-history.log` |
| GitHub Actions | `.github/workflows/ci.yml` |