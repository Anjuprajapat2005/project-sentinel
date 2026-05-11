FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

RUN pnpm config set production true && pnpm install --prod

ENV SERVICE_NAME=payment-service
ENV PORT=4002

EXPOSE 4002

CMD ["node", "dist/index.js"]