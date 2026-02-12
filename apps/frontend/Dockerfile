FROM node:20-alpine AS base

# 依存関係のインストール
FROM base AS deps
WORKDIR /app

COPY package.json turbo.json ./
COPY apps/frontend/package.json ./apps/frontend/
RUN npm install

# ビルド
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY apps/frontend ./apps/frontend
COPY turbo.json ./
WORKDIR /app/apps/frontend

# 環境変数をビルド時に注入
ARG VITE_API_URL
ARG VITE_RELAY_URL
ARG VITE_ERROR_REPORTER_ENABLED

ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_RELAY_URL=${VITE_RELAY_URL}
ENV VITE_ERROR_REPORTER_ENABLED=${VITE_ERROR_REPORTER_ENABLED}

RUN npm run build

# 実行環境（Nginx）
FROM nginx:alpine AS runner
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
