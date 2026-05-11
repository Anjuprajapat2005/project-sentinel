FROM node:20-alpine
WORKDIR /app
RUN npm install -g pnpm@9
COPY package.json pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY scripts/chaos-monkey/package.json ./scripts/chaos-monkey/
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build --filter=@sentinel/chaos-monkey
ENTRYPOINT ["node", "dist/index.js"]