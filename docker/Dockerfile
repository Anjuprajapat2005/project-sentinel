FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/typescript-config/package.json packages/typescript-config/
COPY packages/eslint-config/package.json packages/eslint-config/
RUN corepack enable pnpm && pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable pnpm && pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 app
COPY --from=builder --chown=app:app /app/apps/dashboard/.next/standalone ./
COPY --from=builder --chown=app:app /app/apps/dashboard/.next/static ./
COPY --from=builder --chown=app:app /app/apps/dashboard/public ./public
COPY --from=builder --chown=app:app /app/packages/shared/dist ./packages/shared/dist
USER app
EXPOSE 3000
CMD ["node", "server.js"]
