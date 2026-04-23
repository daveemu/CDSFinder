FROM node:20-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm@9

COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/api/package.json ./packages/api/

RUN pnpm install --frozen-lockfile

COPY packages/shared ./packages/shared
COPY packages/api ./packages/api

RUN pnpm --filter=shared run build
RUN pnpm --filter=api run build

FROM node:20-alpine AS runtime
WORKDIR /app

RUN npm install -g pnpm@9

COPY package.json pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/api/package.json ./packages/api/

RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/api/dist ./packages/api/dist

EXPOSE 3001
CMD ["node", "packages/api/dist/index.js"]
