FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json ./
COPY packages/shared/package.json ./packages/shared/package.json
COPY apps/dashboard/package.json ./apps/dashboard/package.json
RUN npm install -g pnpm@9 && pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build --filter=@sentinel/dashboard

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/apps/dashboard/.next/standalone ./
COPY --from=builder /app/apps/dashboard/.next/static ./.next/static
COPY --from=builder /app/node_modules/@sentinel/shared ./node_modules/@sentinel/shared
USER nextjs
EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]