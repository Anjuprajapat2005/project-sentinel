# Project Sentinel - Autonomous Incident Resolution Engine

> Claude Code integration guide for the autonomous incident resolution system with multi-agent orchestration.

## Project Overview

Project Sentinel is an autonomous incident resolution system with AI agents that detect, analyze, fix, and validate failures in a microservices architecture.

```
┌─────────────────────────────────────────────────────────────┐
│                   MCP Server (Port 3456)                    │
│                  SQLite + JSON Hybrid                       │
├─────────────────────────────────────────────────────────────┤
│  Alpha (Debugger)  │  Beta (QA)      │  Gamma (Manager)    │
│  - Log analysis    │  - Test create  │  - Orchestration    │
│  - Root cause      │  - Test execute │  - Report gen        │
│  - Fix generation  │  - Validation   │  - Workflow control │
├─────────────────────────────────────────────────────────────┤
│                    Next.js Dashboard                        │
│              (apps/dashboard - Port 3000)                   │
│  - Active Incidents   - Resolved   - System Health         │
│  - Post-Mortem        - Logs       - Agent Status          │
└─────────────────────────────────────────────────────────────┘
```

---

## Architecture

### Monorepo Structure

```
project-sentinel/
├── apps/
│   ├── dashboard/              # Next.js 14 UI (Port 3000)
│   │   └── src/
│   │       ├── app/           # Pages (App Router)
│   │       ├── components/     # UI components (shadcn/ui)
│   │       └── hooks/          # Custom React hooks
│   └── services/              # Express.js microservices
│       ├── api-gateway/        # Port 4000
│       ├── auth-service/       # Port 4001
│       ├── payment-service/    # Port 4002
│       ├── notification-service/ # Port 4003
│       └── monitoring-service/ # Port 4004
├── database/                  # SQLite DB + JSON storage
│   ├── sentinel.db           # SQLite database
│   └── sentinel.json         # JSON-based storage
├── scripts/
│   ├── mcp-server.js         # MCP server (Port 3456)
│   ├── sentinel-agent.js      # Multi-agent orchestration
│   ├── chaos-monkey/          # Chaos injection engine
│   └── notifications/          # Slack notification module
├── tests/                     # Auto-generated regression tests
├── docs/
│   └── incident-history.log   # Resolution history (append-only)
└── .github/workflows/         # CI/CD pipeline
```

### Service Ports

| Service | Port | Description |
|---------|------|-------------|
| Dashboard | 3000 | Next.js monitoring UI |
| MCP Server | 3456 | Database access API |
| API Gateway | 4000 | Microservices entry point |
| Auth Service | 4001 | JWT authentication |
| Payment Service | 4002 | Payment processing |
| Notification Service | 4003 | Email/push notifications |
| Monitoring Service | 4004 | Metrics collection |

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

---

## Coding Standards

### TypeScript Strict Mode

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
function isValidIncident(incident: unknown): incident is Incident {
  return (
    typeof incident === 'object' &&
    incident !== null &&
    'id' in incident &&
    'service_name' in incident
  );
}
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Classes | PascalCase | `AlphaDebugger`, `BetaQA`, `GammaManager` |
| Interfaces | PascalCase | `Incident`, `ResolutionResult` |
| Methods | camelCase | `analyzeIncident`, `generateFix` |
| Constants | UPPER_SNAKE | `MAX_RETRIES`, `DEFAULT_INTERVAL` |
| Tables | snake_case | `incident_reports`, `agent_logs` |
| Columns | snake_case | `service_name`, `chaos_type` |

---

## Agent System

### Agent Overview

| Agent | Role | File | Primary Responsibilities |
|-------|------|------|-------------------------|
| **Alpha** | Debugger | `database/agents/alpha.js` | Log analysis, root cause, fix generation |
| **Beta** | QA | `database/agents/beta.js` | Test creation, test execution, validation |
| **Gamma** | Manager | `database/agents/gamma.js` | Orchestration, workflow control, reporting |

### Alpha (Debugger)

```typescript
class AlphaDebugger {
  async analyzeIncident(incident: Incident): Promise<AnalysisResult>
  analyzeLogs(logs: LogEntry[]): Analysis
  identifyPatterns(messages: string[]): Pattern[]
  determineRootCause(patterns: Pattern[], errors: Error[]): string
  generateSuggestions(patterns: Pattern[], errors: Error[]): Suggestion[]
  async generateFix(incident: Incident, analysis: AnalysisResult): Promise<FixResult>
}
```

**Chaos Type Handlers:**
- `syntax_error` - Remove injected markers
- `logic_bug` - Revert incorrect logic
- `deleted_dependency` - Note dependency restoration requirements
- `invalid_json` - Re-parse and stringify
- `type_mismatch` - Restore type annotations

### Beta (QA)

```typescript
class BetaQA {
  async createRegressionTests(incident: Incident, analysis: AnalysisResult): Promise<TestResult>
  async runRegressionTests(incidentId: number): Promise<TestRunResult>
  async getTestsForIncident(incidentId: number): Test[]
  getTestStats(): TestStats
}
```

**Test Types by Chaos:**
- `syntax_error` → Syntax validation + TypeScript compilation tests
- `logic_bug` → Logic validation + status validation tests
- `deleted_dependency` → Dependency check + module resolution tests
- `invalid_json` → JSON validation + config schema tests
- `type_mismatch` → Type checking + type inference tests

### Gamma (Manager)

```typescript
class GammaManager {
  startAutonomousMode(intervalMs?: number): void
  stopAutonomousMode(): void
  async processIncidents(): Promise<void>
  async resolveIncident(incident: Incident): Promise<ResolutionResult>
  async resolveIncidentManually(incidentId: number): Promise<ResolutionResult>
  generateReport(...): Report
  async saveReport(report: Report): number
  generatePostMortem(): PostMortemReport
}
```

**Workflow Steps:**
1. Detect critical active incidents
2. Invoke Alpha to analyze and generate fix
3. Invoke Beta to create and run tests
4. Generate incident report with full workflow
5. Save report to SQLite
6. Update incident status to `resolved`
7. Broadcast resolution to connected clients

---

## Incident Resolution Workflow

### Resolution Protocol

**CRITICAL: Always check incident-history.log before applying a fix!**

```bash
# 1. Check if this fix has been attempted before
cat docs/incident-history.log

# 2. If same chaos_type + service + fix pattern exists with "FAILED" status:
#    → Do NOT use the same approach
#    → Use Thinking Mode to find alternative
#    → Document the new attempt in patterns

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
│   FAILED    │ (if any step fails)
└─────────────┘
```

### Manual Resolution Steps

```bash
# Step 1: Start MCP server
node scripts/mcp-server.js

# Step 2: Analyze the service
node scripts/sentinel-agent.js analyze auth-service

# Step 3: Run full autonomous resolution
node scripts/sentinel-agent.js resolve auth-service

# Step 4: Verify the fix
node scripts/sentinel-agent.js list
```

### Autonomous Mode

```bash
# Start autonomous mode (checks every 30 seconds)
# Via MCP server WebSocket or terminal:
node scripts/sentinel-agent.js autonomous start

# Stop autonomous mode
node scripts/sentinel-agent.js autonomous stop
```

---

## Chaos Monkey Workflow

### Overview

The Chaos Monkey randomly injects bugs into microservices to test the autonomous resolution system.

### Chaos Types

| Type | Severity | Description |
|------|----------|-------------|
| `syntax_error` | Critical | Injects syntax error causing compilation failure |
| `logic_bug` | High | Introduces logic bug causing incorrect behavior |
| `deleted_dependency` | Critical | Removes required dependency from package.json |
| `invalid_json` | High | Corrupts JSON configuration file |
| `type_mismatch` | Medium | Introduces TypeScript type mismatch |

### Running Chaos Monkey

```bash
# Inject random chaos into all services
node scripts/chaos-monkey.js inject

# Inject chaos into specific service
node scripts/chaos-monkey.js inject auth-service

# List all active incidents
node scripts/chaos-monkey.js incidents

# Rollback a specific incident
node scripts/chaos-monkey.js rollback <incident_id>

# Run in continuous mode (random injections)
node scripts/chaos-monkey.js

# Show help
node scripts/chaos-monkey.js --help
```

### Chaos Injection Targets

```javascript
const targets = [
  { service: 'auth-service', port: 4001, files: ['src/routes/auth.ts', 'src/index.ts'] },
  { service: 'payment-service', port: 4002, files: ['src/routes/payments.ts', 'src/index.ts'] },
  { service: 'notification-service', port: 4003, files: ['src/routes/notifications.ts', 'src/index.ts'] },
];
```

### Rollback Process

```bash
# List available rollbacks
node scripts/chaos-monkey.js incidents

# Rollback specific incident
node scripts/chaos-monkey.js rollback 1
```

---

## Testing Strategy

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

### Test Creation

Beta agent creates tests based on chaos type:

```typescript
switch (chaosType) {
  case 'syntax_error':
    return this.createSyntaxTests(serviceName, targetFile);
  case 'logic_bug':
    return this.createLogicTests(serviceName, targetFile, analysis);
  case 'deleted_dependency':
    return this.createDependencyTests(serviceName);
  case 'invalid_json':
    return this.createJsonValidationTests(serviceName);
  case 'type_mismatch':
    return this.createTypeTests(serviceName, targetFile);
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

### Running Tests

```bash
# Run all regression tests
pnpm test

# Run specific service tests
pnpm --filter @sentinel/dashboard test

# Run with coverage
pnpm test --coverage
```

---

## Deployment Process

### Environment Requirements

| Component | Port | Description |
|-----------|------|-------------|
| WebSocket Server | 8080 | SQLite + agent system (legacy) |
| Dashboard | 3000 | Next.js UI |
| MCP Server | 3456 | Database access |
| Auth Service | 4001 | Microservice |
| Payment Service | 4002 | Microservice |
| Notification Service | 4003 | Microservice |

### Start Sequence

```bash
# 1. Start MCP server (must be first)
cd C:\Users\praja\project-sentinel
node scripts/mcp-server.js

# 2. Start dashboard (in separate terminal)
cd C:\Users\praja\project-sentinel
pnpm --filter @sentinel/dashboard dev

# 3. Start microservices (optional)
cd apps/services/auth-service && node src/index.js
cd apps/services/payment-service && node src/index.js
```

### Vercel Deployment

The dashboard deploys to Vercel via GitHub Actions.

**Required Secrets:**
- `VERCEL_TOKEN` - Vercel API token
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID` - Vercel project ID

**Configure in GitHub:** Settings → Secrets and variables → Actions

### GitHub Actions CI/CD

```yaml
# .github/workflows/ci.yml
jobs:
  lint-and-typecheck:
    - name: Checkout
    - name: Setup pnpm
    - name: Install dependencies
    - name: Lint
    - name: Typecheck

  build:
    needs: lint-and-typecheck
    - name: Build
    - name: Run tests

  deploy-vercel:
    needs: build
    if: github.ref == 'refs/heads/main'
    - name: Deploy to Vercel
```

---

## Debugging Process

### MCP Server Debugging

```bash
# Start MCP server with verbose logging
DEBUG=* node scripts/mcp-server.js

# Test MCP endpoints
curl "http://localhost:3456/?action=services"
curl "http://localhost:3456/?action=incidents"
curl "http://localhost:3456/?action=health"
curl "http://localhost:3456/?action=stats"
```

### Service Health Checks

```bash
# Check service health
curl http://localhost:4001/health
curl http://localhost:4002/health
curl http://localhost:4003/health

# Check all services at once
curl "http://localhost:3456/?action=health"
```

### Agent Debugging

```bash
# Analyze specific service
node scripts/sentinel-agent.js analyze auth-service

# Show all services
node scripts/sentinel-agent.js list

# Resolve with verbose output
node scripts/sentinel-agent.js resolve auth-service --verbose
```

### Log Analysis

```bash
# View incident history
cat docs/incident-history.log

# View agent logs in database
sqlite3 database/sentinel.db "SELECT * FROM agent_logs ORDER BY timestamp DESC LIMIT 10;"

# View all incidents
sqlite3 database/sentinel.db "SELECT * FROM incidents WHERE status = 'active';"
```

### Common Issues

| Issue | Solution |
|-------|----------|
| Port 3000 already in use | `taskkill /F /IM node.exe` or find PID with `netstat -ano \| grep ":3000"` |
| MCP server won't start | Check if another process is using port 3456 |
| Dashboard shows 500 error | Clear `.next` cache: `rm -rf apps/dashboard/.next` |
| sql.js module not found | Run `pnpm install` in root directory |
| Services not responding | Check if services are running with `netstat -ano \| grep ":400"` |

---

## Troubleshooting

### Quick Diagnostic

```bash
# 1. Check if dashboard is responding
curl http://localhost:3000/api/stats

# 2. Check MCP server
curl "http://localhost:3456/?action=health"

# 3. Check database
sqlite3 database/sentinel.db "SELECT * FROM services;"

# 4. Check incidents
curl "http://localhost:3456/?action=incidents"

# 5. Check running processes
netstat -ano | grep "LISTENING"
```

### Reset Everything

```bash
# Kill all Node processes
taskkill /F /IM node.exe

# Clean dashboard cache
rm -rf apps/dashboard/.next

# Rebuild dashboard
cd apps/dashboard && pnpm build

# Start fresh
node scripts/mcp-server.js &
cd apps/dashboard && npx next start -p 3000 &
```

### Database Issues

```bash
# Backup database
cp database/sentinel.db database/sentinel.db.backup

# Reset to default state
rm database/sentinel.db
# MCP server will recreate on next start

# View database contents
sqlite3 database/sentinel.db ".tables"
sqlite3 database/sentinel.db "SELECT * FROM incidents;"
```

### Rebuild from Scratch

```bash
# Clean install
rm -rf node_modules apps/dashboard/.next
pnpm install

# Build all packages
pnpm build

# Start MCP server
node scripts/mcp-server.js &

# Start dashboard
cd apps/dashboard && npx next start -p 3000 &
```

---

## Commands Reference

### Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run development
pnpm dev

# Lint
pnpm lint

# Typecheck
pnpm typecheck

# Format code
pnpm format
```

### Dashboard

```bash
# Start dashboard in dev mode
pnpm --filter @sentinel/dashboard dev

# Build dashboard
pnpm --filter @sentinel/dashboard build

# Start production dashboard
cd apps/dashboard && npx next start -p 3000
```

### Agents

```bash
# Start MCP server
node scripts/mcp-server.js

# Analyze service
node scripts/sentinel-agent.js analyze <service>

# Full resolution
node scripts/sentinel-agent.js resolve <service>

# List services
node scripts/sentinel-agent.js list

# Help
node scripts/sentinel-agent.js help
```

### Chaos Monkey

```bash
# Inject chaos
node scripts/chaos-monkey.js inject

# List incidents
node scripts/chaos-monkey.js incidents

# Rollback
node scripts/chaos-monkey.js rollback <id>
```

### Microservices

```bash
# Start auth service
cd apps/services/auth-service && node src/index.js

# Start payment service
cd apps/services/payment-service && node src/index.js

# Start notification service
cd apps/services/notification-service && node src/index.js
```

---

## File Locations

| File | Path |
|------|-------|
| Alpha (Debugger) | `database/agents/alpha.js` |
| Beta (QA) | `database/agents/beta.js` |
| Gamma (Manager) | `database/agents/gamma.js` |
| MCP Server | `scripts/mcp-server.js` |
| Sentinel Agent | `scripts/sentinel-agent.js` |
| Chaos Monkey | `scripts/chaos-monkey.js` |
| Dashboard Hooks | `apps/dashboard/src/hooks/use-websocket.ts` |
| Overview Page | `apps/dashboard/src/app/overview/page.tsx` |
| Database | `database/sentinel.db` |
| Incident History | `docs/incident-history.log` |
| GitHub Actions | `.github/workflows/ci.yml` |
| MCP Config | `.claude/mcp.json` |

---

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

**4. No direct SQL injection:**
```typescript
// Forbidden
const sql = `SELECT * FROM users WHERE name = '${userInput}'`;

// Required
const sql = 'SELECT * FROM users WHERE name = ?';
const params = [userInput];
```

### Architecture Patterns

**1. No circular dependencies between agents:**
- Agents receive dependencies via constructor, not imports

**2. No agent logic in dashboard components:**
- UI only; server handles all business logic

**3. No hardcoded connection strings:**
- Use relative paths or environment variables

**4. No blocking operations in WebSocket:**
- Use async operations for database queries

---

## Quick Reference

### Dashboard URLs

| Page | URL | Description |
|------|-----|-------------|
| Overview | http://localhost:3000/overview | System overview |
| Active Incidents | http://localhost:3000/incidents/active | Failing services |
| Resolved | http://localhost:3000/incidents/resolved | Fixed incidents |
| Post-Mortem | http://localhost:3000/post-mortem | Daily reports |
| System Health | http://localhost:3000/health | Service health |
| Logs | http://localhost:3000/logs | Application logs |

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/?action=services` | GET | Get all services |
| `/?action=incidents` | GET | Get incidents |
| `/?action=agents` | GET | Get agent status |
| `/?action=health` | GET | System health |
| `/?action=stats` | GET | Dashboard stats |
| `/update` | POST | Update database |

### Service Status Values

| Status | Meaning |
|--------|---------|
| `healthy` | Service is running normally |
| `critical` | Service is failing - requires attention |
| `investigating` | Agent is analyzing the issue |
| `resolving` | Fix is being applied |
| `resolved` | Issue has been fixed |

---

*Last updated: 2026-05-11*
*Project Sentinel v1.0.0*
