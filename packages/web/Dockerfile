FROM node:20-alpine AS builder
WORKDIR /app

# Empty = relative URLs (/api/v1/...) so nginx proxies internally to the api container.
# Override only when the API is on a different host (e.g. split deployment).
ARG VITE_API_BASE_URL=
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm install -g pnpm@9

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/web/package.json ./packages/web/

RUN pnpm install --frozen-lockfile

COPY packages/shared ./packages/shared
COPY packages/web ./packages/web

RUN pnpm --filter=shared run build
RUN pnpm --filter=web run build

FROM nginx:alpine AS runtime
COPY --from=builder /app/packages/web/dist /usr/share/nginx/html
COPY packages/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
