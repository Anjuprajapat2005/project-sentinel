FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json ./
COPY packages/shared/package.json ./packages/shared/package.json
COPY apps/services/notification-service/package.json ./apps/services/notification-service/package.json
RUN npm install -g pnpm@9 && pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build --filter=@sentinel/notification-service

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 servicename
COPY --from=builder /app/apps/services/notification-service/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
USER servicename
EXPOSE 4002
CMD ["node", "dist/index.js"]