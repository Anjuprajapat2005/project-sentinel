# Project Sentinel - Autonomous Incident Resolution Engine

> An autonomous incident resolution system with AI agents that detect, analyze, fix, and validate failures in a microservices architecture.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   MCP Server (Port 3456)                   │
│                  SQLite + JSON Hybrid                       │
├─────────────────────────────────────────────────────────────┤
│  Alpha (Debugger)  │  Beta (QA)      │  Gamma (Manager)    │
│  - Log analysis    │  - Test create  │  - Orchestration    │
│  - Root cause      │  - Test execute │  - Report gen        │
│  - Fix generation  │  - Validation   │  - Workflow control │
├─────────────────────────────────────────────────────────────┤
│                    Next.js Dashboard                        │
│              (apps/dashboard - Port 3006)                   │
│  - Active Incidents   - Resolved   - System Health         │
│  - Post-Mortem        - Logs       - Agent Status          │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

```bash
# Install dependencies
pnpm install

# Start MCP Server (required for real-time monitoring)
node scripts/mcp-server.js

# In another terminal, start dashboard
pnpm --filter @sentinel/dashboard dev

# Run autonomous resolution
node scripts/sentinel-agent.js resolve <service>
```

## Available Services

| Service | Port | Status |
|---------|------|--------|
| Dashboard | 3000 | Next.js monitoring UI |
| auth-service | 4001 | Express microservice |
| payment-service | 4002 | Express microservice |
| notification-service | 4003 | Express microservice |

## MCP Server Endpoints

```bash
curl "http://localhost:3456/?action=services"    # Get all services
curl "http://localhost:3456/?action=incidents"   # Get active incidents
curl "http://localhost:3456/?action=health"     # System health
curl "http://localhost:3456/?action=stats"      # Dashboard stats
curl "http://localhost:3456/?action=agents"     # Agent status
```

## Multi-Agent System

### Alpha (Debugger)
Traces errors in backend code and generates fixes.
```bash
node scripts/sentinel-agent.js analyze auth-service
```

### Beta (QA)
Writes regression tests to prevent bug recurrence.
```bash
# Tests auto-generated during resolution
ls tests/*-regression.test.js
```

### Gamma (Manager)
Orchestrates the full resolution workflow.
```bash
node scripts/sentinel-agent.js resolve notification-service
```

## Dashboard Pages

| Page | URL | Description |
|------|-----|-------------|
| Overview | `/overview` | System overview with metrics |
| Active Incidents | `/incidents/active` | Currently failing services |
| Resolved | `/incidents/resolved` | Fixed incidents |
| Post-Mortem | `/post-mortem` | Daily incident reports |
| System Health | `/health` | Service health status |
| Logs | `/logs` | Application logs |

## Capstone Checklist

| Requirement | Status | Notes |
|------------|--------|-------|
| Monorepo structure | ✅ | pnpm workspace |
| Next.js dashboard | ✅ | 16 pages built |
| Microservices | ✅ | 5 services |
| Chaos Monkey | ✅ | 5 bug types |
| MCP Integration | ✅ | HTTP server on :3456 |
| Multi-Agent | ✅ | Alpha/Beta/Gamma |
| Dark-mode UI | ✅ | shadcn/ui |
| Resolution Protocol | ✅ | CLAUDE.md |
| GitHub Actions | ✅ | CI/CD pipeline |
| Vercel config | ✅ | vercel.json |
| Regression Tests | ✅ | Auto-generated |

## Tech Stack

- **Monorepo**: pnpm workspaces + Turbo
- **Dashboard**: Next.js 14 + Tailwind + shadcn/ui
- **Services**: Express.js with TypeScript
- **Database**: SQLite + JSON file storage
- **Agents**: Node.js ESM modules
- **CI/CD**: GitHub Actions + Vercel

## Project Structure

```
project-sentinel/
├── apps/
│   ├── dashboard/              # Next.js UI
│   │   └── src/
│   │       ├── app/           # Pages (Next.js app router)
│   │       ├── components/     # UI components
│   │       └── hooks/          # Custom hooks
│   └── services/              # Microservices
│       ├── auth-service/
│       ├── payment-service/
│       └── notification-service/
├── database/                  # SQLite DB + JSON
├── scripts/
│   ├── mcp-server.js         # MCP server
│   ├── sentinel-agent.js      # Multi-agent orchestration
│   ├── chaos-monkey/          # Chaos injection
│   └── demo/                  # Demo scripts
├── tests/                     # Regression tests
├── docs/                     # Documentation
│   └── incident-history.log   # Resolution history
└── .github/workflows/         # CI/CD
```

## Deployment

The dashboard deploys to Vercel via GitHub Actions. Configure these secrets:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
