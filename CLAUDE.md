# Project Sentinel — CLAUDE.md

> **Primary Context File** — Read this file before making any changes to the Project Sentinel monorepo.
> Claude Code uses this file as the authoritative reference for all project conventions, workflows, and standards.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Monorepo Structure](#3-monorepo-structure)
4. [Coding Standards](#4-coding-standards)
5. [TypeScript Strict Rules](#5-typescript-strict-rules)
6. [Incident Response Workflow](#6-incident-response-workflow)
7. [Debugging Workflow](#7-debugging-workflow)
8. [Autonomous Agent Workflow](#8-autonomous-agent-workflow)
9. [Subagent Responsibilities](#9-subagent-responsibilities)
10. [Testing Strategy](#10-testing-strategy)
11. [Deployment Workflow](#11-deployment-workflow)
12. [WebSocket Architecture](#12-websocket-architecture)
13. [Monitoring Architecture](#13-monitoring-architecture)
14. [Forbidden Coding Patterns](#14-forbidden-coding-patterns)
15. [Git Workflow](#15-git-workflow)
16. [Commit Conventions](#16-commit-conventions)
17. [Package Management Rules](#17-package-management-rules)
18. [Build Commands](#18-build-commands)
19. [Run Commands](#19-run-commands)
20. [Troubleshooting Guide](#20-troubleshooting-guide)
21. [MCP Integration](#21-mcp-integration)
22. [Chaos Monkey Workflow](#22-chaos-monkey-workflow)

---

## 1. Project Overview

**Project Sentinel** is an autonomous incident resolution engine for microservices architecture. It uses a multi-agent system (Alpha/Beta/Gamma) to detect failures, analyze root causes, generate fixes, create regression tests, and validate resolutions — all without human intervention.

### Core Capabilities

- **Real-Time Monitoring** — MCP server polls services and tracks health status
- **Chaos Injection** — Chaos Monkey introduces bugs to test autonomous resolution
- **Multi-Agent Orchestration** — Three specialized agents work in concert
- **Incident Resolution** — Automatic detection → analysis → fix → validation → reporting
- **Post-Mortem Generation** — Daily reports with metrics and root cause analysis
- **Dark-Mode Dashboard** — Next.js UI with system health, incidents, and logs

### Tech Stack

| Layer | Technology |
|-------|------------|
| Monorepo | pnpm workspaces + Turbo |
| Frontend | Next.js 14 (App Router) + Tailwind + shadcn/ui |
| Services | Express.js + TypeScript |
| Database | SQLite (sql.js) + JSON file storage |
| Agents | Node.js ESM modules |
| CI/CD | GitHub Actions + Vercel |
| Protocol | MCP (Model Context Protocol) |

### Version

```
Project Sentinel v1.0.0
Last Updated: 2026-05-11
```

---

## 2. Architecture

### System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Claude Code (Main Agent)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                     MCP Server (Port 3456)                            │  │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐              │  │
│  │  │ /?action=     │  │ /?action=     │  │ /?action=     │              │  │
│  │  │   services   │  │  incidents   │  │   health     │              │  │
│  │  └───────────────┘  └───────────────┘  └───────────────┘              │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                      │                                      │
│  ┌──────────────────────────────┐    │    ┌──────────────────────────────┐  │
│  │     Alpha (Debugger)          │◄───┼───►│       Beta (QA)              │  │
│  │  • Analyze logs               │    │    │  • Create regression tests   │  │
│  │  • Find root cause            │    │    │  • Execute test suites        │  │
│  │  • Generate fixes            │    │    │  • Validate fixes            │  │
│  └──────────────────────────────┘    │    └──────────────────────────────┘  │
│                                      │                                      │
│  ┌───────────────────────────────────┴───────────────────────────────────┐  │
│  │                        Gamma (Manager)                                  │  │
│  │  • Orchestrate workflow     • Generate reports                         │  │
│  │  • Control autonomous mode  • Broadcast resolutions                    │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                      │                                      │
│  ┌───────────────────────────────────▼───────────────────────────────────┐  │
│  │                        Next.js Dashboard (Port 3000)                     │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │  │
│  │  │  Overview   │ │  Incidents   │ │ Post-Mortem  │ │   Health    │    │  │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘    │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                      │                                      │
│  ┌───────────────────────────────────▼───────────────────────────────────┐  │
│  │                        Microservices (Ports 4001-4003)                   │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │  │
│  │  │auth-service │ │payment-svc  │ │notif-svc    │ │monitor-svc  │    │  │
│  │  │  (4001)     │ │  (4002)     │ │  (4003)     │ │  (4004)     │    │  │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘    │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
1. Services emit health checks → MCP Server polls → Updates database
2. Critical status detected → Gamma spawns → Alpha analyzes
3. Alpha generates fix → Beta creates tests → Beta runs tests
4. Fix validated → Gamma generates report → Dashboard updated
5. Resolution broadcast → Incident history logged → Post-mortem updated
```

---

## 3. Monorepo Structure

```
project-sentinel/
├── apps/
│   ├── dashboard/                      # Next.js 14 monitoring UI
│   │   ├── src/
│   │   │   ├── app/                   # App Router pages
│   │   │   │   ├── api/              # API routes (stats, services, etc.)
│   │   │   │   ├── incidents/        # Incident pages
│   │   │   │   ├── overview/         # Main dashboard
│   │   │   │   ├── post-mortem/       # Post-mortem reports
│   │   │   │   ├── health/           # System health
│   │   │   │   └── logs/              # Application logs
│   │   │   ├── components/           # React components
│   │   │   │   ├── ui/               # shadcn/ui components
│   │   │   │   ├── layout/           # Header, Sidebar
│   │   │   │   └── dashboard/        # Dashboard-specific components
│   │   │   ├── hooks/                # Custom React hooks
│   │   │   └── lib/                   # Utilities (utils, types)
│   │   └── package.json
│   └── services/                      # Express.js microservices
│       ├── api-gateway/              # Port 4000
│       ├── auth-service/            # Port 4001
│       ├── payment-service/         # Port 4002
│       ├── notification-service/    # Port 4003
│       └── monitoring-service/      # Port 4004
├── packages/
│   └── shared/                      # Shared types and utilities
├── scripts/
│   ├── mcp-server.js                # MCP server (Port 3456)
│   ├── sentinel-agent.js            # Multi-agent orchestration
│   ├── chaos-monkey/                # Chaos injection engine
│   │   └── dist/                    # Compiled chaos scripts
│   ├── notifications/
│   │   └── slack.js                # Slack notification module
│   └── demo/
│       └── run-demo.js             # Demo workflow script
├── database/
│   ├── sentinel.db                 # SQLite database
│   ├── sentinel.json               # JSON-based storage
│   ├── agents/                     # Agent modules
│   │   ├── alpha.js                # Debugger agent
│   │   ├── beta.js                 # QA agent
│   │   └── gamma.js                # Manager agent
│   └── server/
│       └── index.js               # WebSocket server (legacy)
├── tests/                          # Auto-generated regression tests
│   └── *-regression.test.js        # Test files by service
├── docs/
│   ├── CLAUDE.md                   # This file
│   └── incident-history.log         # Resolution history (append-only)
├── .github/
│   └── workflows/
│       └── ci.yml                 # CI/CD pipeline
├── .claude/
│   └── mcp.json                    # MCP server configuration
├── turbo.json                      # Turbo configuration
├── pnpm-workspace.yaml             # pnpm workspace config
├── package.json                    # Root package.json
└── tsconfig.json                   # Root TypeScript config
```

### Package Naming Convention

| Package | Scope | Example |
|---------|-------|---------|
| Apps | `@sentinel/` | `@sentinel/dashboard` |
| Services | `@sentinel/` | `@sentinel/auth-service` |
| Shared | `@sentinel/` | `@sentinel/shared` |
| Scripts | `@sentinel/` | `@sentinel/scripts` |

---

## 4. Coding Standards

### General Principles

1. **Explicit over Implicit** — No hidden magic, clear intent
2. **Fail Fast** — Validate inputs early, crash loudly on bugs
3. **Single Responsibility** — Each function does one thing well
4. **Dependency Injection** — Pass dependencies via constructor, not imports
5. **No Premature Optimization** — Write clear code first

### JavaScript/TypeScript Standards

- Use ESM (`import/export`) for all new modules
- Use `const` by default, `let` only when reassignment needed
- Prefer arrow functions for callbacks
- Use async/await over raw Promises
- Use template literals over string concatenation
- Use destructuring for objects and arrays

```typescript
// Good
const { id, name, status } = service;
const [first, ...rest] = items;
const url = `http://localhost:${port}/api/${endpoint}`;

// Bad
const id = service.id;
const name = service.name;
const first = items[0];
const url = 'http://localhost:' + port + '/api/' + endpoint;
```

### React Standards

- Use functional components with hooks
- Use TypeScript for all component props
- Keep components under 200 lines
- Extract custom hooks for reusable logic
- Use `useCallback` and `useMemo` for expensive operations

```typescript
// Good — custom hook extracted
export function useServiceStatus(serviceId: number) {
  const [status, setStatus] = useState<ServiceStatus | null>(null);
  // ...
  return { status, refetch };
}

// Bad — logic in component
function MyComponent() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // 100+ lines of logic
}
```

### File Organization

| File Type | Location | Naming |
|----------|----------|--------|
| Page components | `src/app/` | `page.tsx` |
| Shared components | `src/components/` | `PascalCase.tsx` |
| Custom hooks | `src/hooks/` | `use-kebab-case.ts` |
| Utilities | `src/lib/` | `kebab-case.ts` |
| Types | `src/lib/types/` | `kebab-case-types.ts` |
| API routes | `src/app/api/` | `route.ts` |

---

## 5. TypeScript Strict Rules

### Compiler Configuration

All TypeScript code must use strict mode:

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
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true
  }
}
```

### Required Patterns

**Function parameters must have explicit types:**

```typescript
// Required
function getService(id: number): Service | null {
  // ...
}

// Forbidden — implicit any
function getService(id) {
  // ...
}
```

**Return types must be explicit:**

```typescript
// Required
async function fetchIncidents(status: string): Promise<Incident[]> {
  const response = await fetch(`/api/incidents?status=${status}`);
  return response.json();
}

// Forbidden — implicit any
async function fetchIncidents(status) {
  const response = await fetch(`/api/incidents?status=${status}`);
  return response.json();
}
```

**Null checks are mandatory:**

```typescript
// Required — explicit null handling
function getServiceStatus(serviceId: number): ServiceStatus | null {
  const service = this.query('SELECT * FROM services WHERE id = ?', [serviceId]);
  return service[0] ?? null;
}

// Forbidden — no null check
function getServiceStatus(serviceId: number) {
  const service = this.query('SELECT * FROM services WHERE id = ?', [serviceId]);
  return service[0]; // Could be undefined
}
```

**Use type guards for complex validation:**

```typescript
function isValidIncident(data: unknown): data is Incident {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.id === 'number' &&
    typeof obj.service_name === 'string' &&
    typeof obj.status === 'string'
  );
}

// Usage
if (isValidIncident(rawData)) {
  console.log(obj.service_name); // TypeScript knows this is safe
}
```

**Never use `any` type:**

```typescript
// Forbidden
function process(data: any) { /* ... */ }

// Required — use unknown or specific types
function process(data: unknown) {
  if (isValidIncident(data)) {
    // Safe to use
  }
}
```

---

## 6. Incident Response Workflow

### Resolution Protocol

**CRITICAL: Always check `incident-history.log` before applying a fix.**

```bash
# 1. Check if this fix has been attempted before
cat docs/incident-history.log

# 2. If same chaos_type + service + fix pattern exists with "FAILED":
#    → Do NOT use the same approach
#    → Use Thinking Mode to find alternative
#    → Document the new attempt

# 3. If no history or previous attempts succeeded:
#    → Proceed with standard fix workflow
```

### Workflow States

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   ACTIVE    │────▶│  ANALYZING  │────▶│   FIXING    │────▶│  RESOLVED   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
      │                                         │
      ▼                                         ▼
┌─────────────┐                          ┌─────────────┐
│   FAILED    │◀─────────────────────────│   FAILED    │
└─────────────┘                          └─────────────┘
```

### Step-by-Step Response

| Step | Agent | Action |
|------|-------|--------|
| 1 | System | Detect critical service status |
| 2 | Gamma | Fetch active incidents |
| 3 | Alpha | Analyze logs and identify root cause |
| 4 | Alpha | Generate fix based on chaos type |
| 5 | Beta | Create regression tests |
| 6 | Beta | Execute tests to validate fix |
| 7 | Gamma | Generate incident report |
| 8 | Gamma | Update incident status to resolved |
| 9 | Gamma | Broadcast resolution to clients |

### Manual Response Commands

```bash
# Full resolution workflow
node scripts/sentinel-agent.js resolve auth-service

# Analyze only
node scripts/sentinel-agent.js analyze auth-service

# List all services
node scripts/sentinel-agent.js list
```

---

## 7. Debugging Workflow

### Quick Diagnostic

```bash
# 1. Check dashboard health
curl http://localhost:3000/api/stats

# 2. Check MCP server
curl "http://localhost:3456/?action=health"

# 3. Check services
curl http://localhost:4001/health
curl http://localhost:4002/health
curl http://localhost:4003/health

# 4. Check database
sqlite3 database/sentinel.db "SELECT * FROM services;"

# 5. Check running processes
netstat -ano | findstr "LISTENING"
```

### MCP Server Debugging

```bash
# Start with debug output
DEBUG=* node scripts/mcp-server.js

# Test endpoints
curl "http://localhost:3456/?action=services"
curl "http://localhost:3456/?action=incidents"
curl "http://localhost:3456/?action=agents"
curl "http://localhost:3456/?action=health"
curl "http://localhost:3456/?action=stats"
```

### Agent Debugging

```bash
# Analyze service with verbose output
node scripts/sentinel-agent.js analyze auth-service --verbose

# Show all services
node scripts/sentinel-agent.js list

# Show help
node scripts/sentinel-agent.js help
```

### Log Analysis

```bash
# View incident history
cat docs/incident-history.log

# Query agent logs
sqlite3 database/sentinel.db "SELECT * FROM agent_logs ORDER BY timestamp DESC LIMIT 20;"

# View active incidents
sqlite3 database/sentinel.db "SELECT * FROM incidents WHERE status = 'active';"

# View failed incidents
sqlite3 database/sentinel.db "SELECT * FROM incidents WHERE status = 'failed';"
```

### Service Debugging

```bash
# Test service health
curl -v http://localhost:4001/health

# Check service logs
tail -f logs/service.log

# Test with different HTTP methods
curl -X POST http://localhost:4001/api/v1/auth/login -H "Content-Type: application/json" -d '{"email":"test@test.com"}'
```

---

## 8. Autonomous Agent Workflow

### Overview

The autonomous agent system runs continuously, polling services and resolving incidents automatically.

### Workflow Sequence

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Autonomous Loop                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   START ──► Poll Services ──► Check Critical ──► Found Incident?          │
│                 │                   │                 │                   │
│                 │                   │                 ▼                   │
│                 │                   │            ANALYZE ───────────────►│
│                 │                   │                 │                      │
│                 │                   │                 ▼                      │
│                 │                   │            GENERATE FIX              │
│                 │                   │                 │                      │
│                 │                   │                 ▼                      │
│                 │                   │            CREATE TESTS               │
│                 │                   │                 │                      │
│                 │                   │                 ▼                      │
│                 │                   │            RUN TESTS                  │
│                 │                   │                 │                      │
│                 │                   │                 ▼                      │
│                 │                   │            GENERATE REPORT            │
│                 │                   │                 │                      │
│                 │                   │                 ▼                      │
│                 │                   │            UPDATE STATUS             │
│                 │                   │                 │                      │
│                 │                   │                 ▼                      │
│                 └───────────────────┴────────────RESOLVED                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Configuration

```bash
# Start autonomous mode with 30-second interval
node scripts/sentinel-agent.js autonomous start --interval=30000

# Start with custom interval
node scripts/sentinel-agent.js autonomous start --interval=60000

# Stop autonomous mode
node scripts/sentinel-agent.js autonomous stop
```

### Monitoring Autonomous Activity

```bash
# Check agent status
curl "http://localhost:3456/?action=agents"

# View agent logs
sqlite3 database/sentinel.db "SELECT * FROM agent_logs WHERE agent_name = 'Gamma' ORDER BY timestamp DESC LIMIT 10;"

# View recent incidents
sqlite3 database/sentinel.db "SELECT * FROM incidents ORDER BY timestamp DESC LIMIT 5;"
```

---

## 9. Subagent Responsibilities

### Agent Matrix

| Agent | Role | Primary Skills | Output |
|-------|------|---------------|--------|
| **Alpha** | Debugger | Log analysis, root cause identification, fix generation | Fixes, analysis reports |
| **Beta** | QA Engineer | Test creation, test execution, validation | Test results, pass/fail reports |
| **Gamma** | Incident Manager | Workflow orchestration, reporting, broadcasting | Incident reports, post-mortems |

### Alpha (Debugger)

**Responsibilities:**
- Analyze incident logs
- Identify error patterns
- Determine root cause
- Generate code fixes

**Methods:**
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
| Chaos Type | Handler Action |
|-----------|---------------|
| `syntax_error` | Remove injected markers, restore syntax |
| `logic_bug` | Revert incorrect logic to previous state |
| `deleted_dependency` | Note dependency restoration requirements |
| `invalid_json` | Re-parse and stringify, preserving data |
| `type_mismatch` | Restore type annotations from backup |

### Beta (QA)

**Responsibilities:**
- Create regression tests
- Execute test suites
- Validate fixes

**Methods:**
```typescript
class BetaQA {
  async createRegressionTests(incident: Incident, analysis: AnalysisResult): Promise<TestResult>
  async runRegressionTests(incidentId: number): Promise<TestRunResult>
  async getTestsForIncident(incidentId: number): Test[]
  getTestStats(): TestStats
}
```

**Test Types by Chaos:**
| Chaos Type | Test Approach |
|-----------|---------------|
| `syntax_error` | Syntax validation + TypeScript compilation |
| `logic_bug` | Logic validation + status checks |
| `deleted_dependency` | Dependency check + module resolution |
| `invalid_json` | JSON validation + schema tests |
| `type_mismatch` | Type checking + type inference tests |

### Gamma (Manager)

**Responsibilities:**
- Orchestrate incident resolution workflow
- Generate incident reports
- Manage autonomous mode

**Methods:**
```typescript
class GammaManager {
  startAutonomousMode(intervalMs?: number): void
  stopAutonomousMode(): void
  async processIncidents(): Promise<void>
  async resolveIncident(incident: Incident): Promise<ResolutionResult>
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

## 10. Testing Strategy

### Test Pyramid

```
        ┌───────────┐
        │   E2E     │  ← Few, slow, high confidence
        ├───────────┤
        │  Integr.  │  ← Medium, test agent interactions
        ├───────────┤
        │   Unit    │  ← Many, fast, test individual functions
        └───────────┘
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

### Test Creation Pattern

```typescript
async createRegressionTests(incident: Incident, analysis: AnalysisResult): Promise<TestResult> {
  switch (incident.chaos_type) {
    case 'syntax_error':
      return this.createSyntaxTests(incident.service_name, incident.target_file);
    case 'logic_bug':
      return this.createLogicTests(incident.service_name, incident.target_file, analysis);
    case 'deleted_dependency':
      return this.createDependencyTests(incident.service_name);
    case 'invalid_json':
      return this.createJsonValidationTests(incident.service_name);
    case 'type_mismatch':
      return this.createTypeTests(incident.service_name, incident.target_file);
    default:
      return this.createGenericTests(incident);
  }
}
```

### Running Tests

```bash
# All tests
pnpm test

# Specific package
pnpm --filter @sentinel/dashboard test

# With coverage
pnpm test --coverage

# Watch mode
pnpm test --watch
```

### Test Locations

| Type | Location |
|------|----------|
| Unit tests | `__tests__/unit/` |
| Integration tests | `__tests__/integration/` |
| Regression tests | `tests/` (auto-generated) |

---

## 11. Deployment Workflow

### Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       GitHub Repository                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Push to main ──► GitHub Actions CI ──► Run Tests ──► Deploy      │
│       │               │                   │              │         │
│       │               ▼                   ▼              ▼         │
│       │         ┌──────────┐        ┌──────────┐   ┌──────────┐   │
│       │         │  Lint   │        │  Build  │   │ Vercel  │   │
│       │         │ Typecheck│        │  Test   │   │ Deploy  │   │
│       │         └──────────┘        └──────────┘   └──────────┘   │
│       │                                                    │         │
│       │                                                    ▼         │
│       │                                           ┌──────────────┐   │
│       │                                           │  Dashboard   │   │
│       │                                           │   Live on    │   │
│       │                                           │  Vercel      │   │
│       │                                           └──────────────┘   │
└───────┴──────────────────────────────────────────────────────────────┘
```

### Environment Configuration

| Environment | Variable | Purpose |
|-------------|----------|---------|
| All | `MCP_PORT` | MCP server port (default: 3456) |
| All | `LOG_LEVEL` | Logging verbosity (info, warn, error) |
| Production | `VERCEL_TOKEN` | Vercel API token |
| Production | `VERCEL_ORG_ID` | Vercel organization ID |
| Production | `VERCEL_PROJECT_ID` | Vercel project ID |
| Optional | `SLACK_WEBHOOK_URL` | Slack notification webhook |

### Start Sequence

```bash
# 1. Start MCP server (must be first)
node scripts/mcp-server.js

# 2. Start dashboard
pnpm --filter @sentinel/dashboard dev

# 3. Start microservices (optional)
cd apps/services/auth-service && node src/index.js
cd apps/services/payment-service && node src/index.js
cd apps/services/notification-service && node src/index.js
```

### Vercel Deployment

The dashboard deploys to Vercel via GitHub Actions.

**Required GitHub Secrets:**
- `VERCEL_TOKEN` — Generate at vercel.com/account/tokens
- `VERCEL_ORG_ID` — Found in Vercel project settings
- `VERCEL_PROJECT_ID` — Found in Vercel project settings

**Configure:** GitHub → Settings → Secrets and variables → Actions → New repository secret

---

## 12. WebSocket Architecture

### Overview

The WebSocket server provides real-time communication for the agent system.

### Connection Flow

```
Client ──► WebSocket Server ──► Agent System ──► SQLite DB
   │              │                    │              │
   │◄─────────────┘◄────────────────────┘◄─────────────┘
   │  Real-time updates and broadcasts
```

### Supported Actions

| Action | Parameters | Description |
|--------|------------|-------------|
| `startAutonomous` | `{ task: { interval: number } }` | Start Gamma's autonomous mode |
| `stopAutonomous` | — | Stop autonomous mode |
| `resolveIncident` | `{ task: { incidentId: number } }` | Trigger manual resolution |
| `getAgentStatus` | — | Get all agent statuses |
| `getReports` | `{ task: { limit: number } }` | Get incident reports |
| `logAgent` | `{ agent: LogEntry }` | Log agent activity |

### Message Format

```typescript
interface WebSocketMessage {
  action: string;
  task?: {
    incidentId?: number;
    interval?: number;
    limit?: number;
  };
  agent?: LogEntry;
}
```

---

## 13. Monitoring Architecture

### Health Check System

```typescript
interface HealthCheck {
  service: string;
  port: number;
  status: 'healthy' | 'critical';
  latency: number;
  timestamp: string;
}
```

### Polling Strategy

| Service Type | Check Interval | Timeout |
|-------------|----------------|---------|
| Dashboard | 5 seconds | 3 seconds |
| MCP Server | 10 seconds | 2 seconds |
| Microservices | 15 seconds | 3 seconds |

### Service Ports

| Service | Port | Health Endpoint |
|---------|------|-----------------|
| Dashboard | 3000 | `/api/stats` |
| MCP Server | 3456 | `/?action=health` |
| API Gateway | 4000 | `/health` |
| Auth Service | 4001 | `/health` |
| Payment Service | 4002 | `/health` |
| Notification Service | 4003 | `/health` |
| Monitoring Service | 4004 | `/health` |

### Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Response time | > 500ms | > 2000ms |
| Failed checks | 2 in a row | 5 in a row |
| Error rate | > 1% | > 5% |
| Memory usage | > 80% | > 95% |

---

## 14. Forbidden Coding Patterns

### Code Patterns

**1. Never use implicit `any`:**
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

**2. Never use bare `catch` without type guard:**
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

**3. Never use non-null assertion without null check:**
```typescript
// Forbidden
const name = user!.name;

// Required
const name = user?.name ?? 'Unknown';
```

**4. Never use direct SQL without parameters:**
```typescript
// Forbidden
const sql = `SELECT * FROM users WHERE name = '${userInput}'`;

// Required
const sql = 'SELECT * FROM users WHERE name = ?';
const params = [userInput];
```

### Architecture Patterns

**1. Never create circular dependencies:**
```typescript
// Forbidden
// alpha.js imports beta
// beta.js imports alpha

// Required — pass dependencies via constructor
class GammaManager {
  constructor(alpha, beta) {
    this.alpha = alpha;
    this.beta = beta;
  }
}
```

**2. Never put agent logic in dashboard components:**
```typescript
// Forbidden — business logic in UI
function AgentPanel() {
  const alpha = new AlphaDebugger();
  const result = await alpha.analyze();
}

// Required — UI only, server handles logic
function AgentStatusPanel() {
  const { agents } = useAgents();
  // Display only
}
```

**3. Never hardcode connection strings:**
```typescript
// Forbidden
const DB_PATH = 'C:\\specific\\path\\sentinel.db';

// Required — use relative or environment
const PROJECT_ROOT = join(__dirname, '..', '..');
const DB_PATH = join(PROJECT_ROOT, 'database', 'sentinel.db');
```

**4. Never use blocking operations in WebSocket:**
```typescript
// Forbidden
ws.on('message', (msg) => {
  const result = syncHeavyOperation();
  ws.send(result);
});

// Required — async operations
ws.on('message', async (msg) => {
  const result = await asyncHeavyOperation();
  ws.send(result);
});
```

---

## 15. Git Workflow

### Branch Strategy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            Branch Structure                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   main ───────────────────────────────────────────────────────► PRODUCTION
│     │                                                                   │
│     ├── develop ──────────────────────────────────────────────► STAGING
│     │     │                                                           │
│     │     ├── feature/incident-resolution ────────────────────► PR     │
│     │     ├── feature/post-mortem-ui ─────────────────────────► PR     │
│     │     └── bugfix/service-health-check ────────────────────► PR     │
│     │                                                                 │
│     └── hotfix/critical-auth-bypass ────────────────────────────► PR     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Branch Naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feature/{short-description}` | `feature/autonomous-mode` |
| Bugfix | `bugfix/{short-description}` | `bugfix/service-health-check` |
| Hotfix | `hotfix/{short-description}` | `hotfix/critical-auth-bypass` |
| Chore | `chore/{short-description}` | `chore/update-dependencies` |

### Workflow

```bash
# 1. Create feature branch from main
git checkout main
git pull
git checkout -b feature/my-feature

# 2. Make changes and commit
git add .
git commit -m "feat: add autonomous mode for incident resolution"

# 3. Push and create PR
git push origin feature/my-feature
gh pr create --title "feat: add autonomous mode" --body "..."

# 4. After PR merged, delete branch
git checkout main
git pull
git branch -d feature/my-feature
```

---

## 16. Commit Conventions

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no code change |
| `refactor` | Code refactoring |
| `test` | Adding tests |
| `chore` | Maintenance tasks |
| `perf` | Performance improvement |

### Scopes

| Scope | Description |
|-------|-------------|
| `dashboard` | UI/dashboard changes |
| `agents` | Agent system changes |
| `mcp` | MCP server changes |
| `api` | API route changes |
| `chaos` | Chaos Monkey changes |
| `deps` | Dependency updates |

### Examples

```bash
# Good
feat(agents): add autonomous mode for incident resolution
fix(dashboard): resolve 404 on post-mortem page
docs(mcp): add endpoint documentation
refactor(api): simplify stats endpoint response

# Bad
fixed stuff
WIP
update
changes
```

### Commit Message Rules

1. Use imperative mood: "add" not "added" or "adds"
2. First line under 72 characters
3. Start with lowercase after type/scope
4. Reference issues: `Closes #123` or `See #456`

---

## 17. Package Management Rules

### pnpm Workspace

The project uses pnpm workspaces with the following structure:

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'apps/services/*'
  - 'packages/*'
  - 'scripts/*'
```

### Adding Dependencies

```bash
# Add to specific workspace
pnpm add <package> --filter @sentinel/dashboard

# Add as dev dependency
pnpm add -D <package> --filter @sentinel/dashboard

# Add to root (for CLI tools)
pnpm add -D <package>
```

### Dependency Rules

1. **No duplicate dependencies** — pnpm hoists shared deps
2. **Always use `--filter`** — Target specific packages
3. **Lock file required** — Never delete `pnpm-lock.yaml`
4. **Public packages only** — No private registry without config

### Version Management

```bash
# Update to latest compatible
pnpm update <package>

# Update to specific version
pnpm add <package>@1.2.3

# Update all
pnpm update
```

---

## 18. Build Commands

### Global Commands

```bash
# Install all dependencies
pnpm install

# Build all packages
pnpm build

# Run development mode
pnpm dev

# Lint all packages
pnpm lint

# Typecheck all packages
pnpm typecheck

# Run tests
pnpm test

# Clean build artifacts
pnpm clean

# Format code
pnpm format
```

### Dashboard Commands

```bash
# Development
pnpm --filter @sentinel/dashboard dev

# Build
pnpm --filter @sentinel/dashboard build

# Start production
cd apps/dashboard && npx next start -p 3000

# Typecheck
pnpm --filter @sentinel/dashboard typecheck

# Lint
pnpm --filter @sentinel/dashboard lint
```

### Service Commands

```bash
# Start specific service
cd apps/services/auth-service && node src/index.js

# Start all services
for dir in apps/services/*/; do
  cd "$dir" && node src/index.js &
  cd ../..
done
```

### Docker Commands

```bash
# Build Docker images
pnpm docker:build

# Start containers
pnpm docker:up

# Stop containers
pnpm docker:down

# View logs
pnpm docker:logs
```

---

## 19. Run Commands

### MCP Server

```bash
# Start MCP server
node scripts/mcp-server.js

# Start with custom port
MCP_PORT=4000 node scripts/mcp-server.js

# Start with debug logging
DEBUG=* node scripts/mcp-server.js
```

### Sentinel Agent

```bash
# Analyze service
node scripts/sentinel-agent.js analyze <service>

# Full resolution
node scripts/sentinel-agent.js resolve <service>

# List services
node scripts/sentinel-agent.js list

# Help
node scripts/sentinel-agent.js help

# Autonomous mode
node scripts/sentinel-agent.js autonomous start --interval=30000
node scripts/sentinel-agent.js autonomous stop
```

### Chaos Monkey

```bash
# Inject chaos
node scripts/chaos-monkey.js inject

# Inject to specific service
node scripts/chaos-monkey.js inject auth-service

# List incidents
node scripts/chaos-monkey.js incidents

# Rollback
node scripts/chaos-monkey.js rollback <incident_id>

# Continuous mode
node scripts/chaos-monkey.js

# Help
node scripts/chaos-monkey.js --help
```

### Microservices

```bash
# Auth service (Port 4001)
cd apps/services/auth-service && node src/index.js

# Payment service (Port 4002)
cd apps/services/payment-service && node src/index.js

# Notification service (Port 4003)
cd apps/services/notification-service && node src/index.js

# API Gateway (Port 4000)
cd apps/services/api-gateway && node src/index.js
```

---

## 20. Troubleshooting Guide

### Quick Reset

```bash
# Kill all Node processes
taskkill /F /IM node.exe

# Clean dashboard cache
rm -rf apps/dashboard/.next

# Rebuild
pnpm build

# Start fresh
node scripts/mcp-server.js &
cd apps/dashboard && npx next start -p 3000 &
```

### Common Issues

| Issue | Diagnosis | Solution |
|-------|-----------|----------|
| Port 3000 in use | `netstat -ano \| findstr ":3000"` | `taskkill /F /PID <PID>` |
| MCP won't start | Check port 3456 | `netstat -ano \| findstr ":3456"` |
| Dashboard 500 error | Clear `.next` | `rm -rf apps/dashboard/.next` |
| sql.js not found | Module resolution | `pnpm install` in root |
| Services not responding | Check ports | `netstat -ano \| findstr ":400"` |

### Database Issues

```bash
# Backup
cp database/sentinel.db database/sentinel.db.backup

# Reset
rm database/sentinel.db
# MCP server recreates on start

# View contents
sqlite3 database/sentinel.db ".tables"
sqlite3 database/sentinel.db "SELECT * FROM incidents;"
```

### Clean Rebuild

```bash
rm -rf node_modules apps/dashboard/.next
pnpm install
pnpm build
```

---

## 21. MCP Integration

### Configuration

```json
// .claude/mcp.json
{
  "mcpServers": {
    "sqlite": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sqlite", "C:/Users/praja/project-sentinel/database/sentinel.db"]
    }
  }
}
```

### MCP Server Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/?action=services` | GET | Get all services with status |
| `/?action=incidents` | GET | Get incidents (status param) |
| `/?action=agents` | GET | Get agent status |
| `/?action=health` | GET | System health summary |
| `/?action=stats` | GET | Dashboard statistics |
| `/update` | POST | Update database records |

### Usage Examples

```bash
# Poll service status
curl "http://localhost:3456/?action=services"

# Check critical services
curl "http://localhost:3456/?action=services&status=critical"

# Get active incidents
curl "http://localhost:3456/?action=incidents"

# Get system health
curl "http://localhost:3456/?action=health"

# Get stats
curl "http://localhost:3456/?action=stats"
```

### Polling Pattern

```bash
# Continuous polling (every 10 seconds)
while true; do
  curl -s "http://localhost:3456/?action=health" | jq '.data.critical'
  sleep 10
done
```

---

## 22. Chaos Monkey Workflow

### Overview

The Chaos Monkey randomly introduces bugs into microservices to test the autonomous resolution system.

### Chaos Types

| Type | Severity | Description |
|------|----------|-------------|
| `syntax_error` | Critical | Injects syntax errors causing compilation failure |
| `logic_bug` | High | Introduces logic bugs causing incorrect behavior |
| `deleted_dependency` | Critical | Removes required dependencies from package.json |
| `invalid_json` | High | Corrupts JSON configuration files |
| `type_mismatch` | Medium | Introduces TypeScript type mismatches |

### Injection Targets

```javascript
const targets = [
  { service: 'auth-service', port: 4001, files: ['src/routes/auth.ts', 'src/index.ts'] },
  { service: 'payment-service', port: 4002, files: ['src/routes/payments.ts', 'src/index.ts'] },
  { service: 'notification-service', port: 4003, files: ['src/routes/notifications.ts', 'src/index.ts'] },
];
```

### Injection Markers

```javascript
const chaosMarkers = [
  "  // inject: unterminated string';\n",
  "  const x = {\n",
  "  missing = ;\n",
  "  func(;\n",
];
```

### Running Chaos Monkey

```bash
# Inject chaos into all services
node scripts/chaos-monkey.js inject

# Inject chaos into specific service
node scripts/chaos-monkey.js inject auth-service

# List all incidents
node scripts/chaos-monkey.js incidents

# Rollback incident
node scripts/chaos-monkey.js rollback 1

# Continuous mode (random injections)
node scripts/chaos-monkey.js

# Help
node scripts/chaos-monkey.js --help
```

### Rollback Process

```bash
# List available rollbacks
node scripts/chaos-monkey.js incidents

# Rollback specific incident
node scripts/chaos-monkey.js rollback 1

# Rollback all
node scripts/chaos-monkey.js rollback --all
```

### Integration with Resolution

```
Chaos Injection ──► Service Fails ──► MCP Detects ──► Gamma Alerts
        │                                           │
        │◄──────────────────────────────────────────┘
        │
        ▼
   Auto-Resolution Loop
        │
        ├──► Alpha Analyzes
        ├──► Alpha Fixes
        ├──► Beta Tests
        └──► Gamma Reports
```

---

## Quick Reference

### Dashboard URLs

| Page | URL |
|------|-----|
| Dashboard | http://localhost:3000 |
| Overview | http://localhost:3000/overview |
| Active Incidents | http://localhost:3000/incidents/active |
| Resolved | http://localhost:3000/incidents/resolved |
| Post-Mortem | http://localhost:3000/post-mortem |
| System Health | http://localhost:3000/health |
| Logs | http://localhost:3000/logs |

### Service Ports

| Service | Port |
|---------|------|
| Dashboard | 3000 |
| MCP Server | 3456 |
| API Gateway | 4000 |
| Auth Service | 4001 |
| Payment Service | 4002 |
| Notification Service | 4003 |
| Monitoring Service | 4004 |

### Essential Commands

```bash
# Start everything
node scripts/mcp-server.js & npx next start -p 3000 &

# Check status
curl "http://localhost:3456/?action=stats"

# Resolve incident
node scripts/sentinel-agent.js resolve auth-service
```

---

*This CLAUDE.md is the authoritative reference for Project Sentinel.*
*All team members must read and follow these conventions.*
*Last updated: 2026-05-11*