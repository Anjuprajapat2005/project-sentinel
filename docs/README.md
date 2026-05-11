# Project Sentinel

Scalable monitoring and chaos engineering platform.

## Structure

```
project-sentinel/
├── apps/
│   └── dashboard/          # Next.js dashboard
├── services/
│   ├── api-gateway/       # API Gateway
│   ├── auth-service/      # Authentication
│   ├── notification-service/
│   └── monitoring-service/
├── scripts/
│   └── chaos/            # Chaos monkey scripts
├── packages/
│   ├── shared/           # Shared types & utilities
│   ├── eslint-config/    # ESLint config
│   └── typescript-config/# TSConfig packages
├── docker/
├── logs/
└── docs/
```

## Quick Start

```bash
# Install dependencies
pnpm install

# Start dev servers
pnpm dev

# Build all
pnpm build

# Docker compose
pnpm docker:build
pnpm docker:up
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| Dashboard | 3000 | Next.js UI |
| API Gateway | 3001 | Request routing |
| Auth | 3002 | Authentication |
| Notification | 3003 | Notifications |
| Monitoring | 3004 | Metrics |
