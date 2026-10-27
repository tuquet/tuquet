FROM node:22-alpine AS builder

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV CI=true

# Install git for VitePress lastUpdated timestamp feature
RUN apk add --no-cache git \
    && npm i -g corepack && corepack enable

WORKDIR /app

COPY package.json pnpm-workspace.yaml* ./
COPY .vitepress ./.vitepress
COPY en ./en
COPY public ./public

# Install dependencies and build
RUN pnpm install --frozen-lockfile=false
RUN pnpm run build

# Stage 2: Production Nginx Server
FROM nginx:stable-alpine AS production

COPY --from=builder /app/.vitepress/dist /usr/share/nginx/html
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
