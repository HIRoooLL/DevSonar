FROM node:20-alpine AS base

# 依存関係のインストール
FROM base AS deps
WORKDIR /app

# workspace設定をコピー
COPY package.json turbo.json ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/error-reporter/package.json ./packages/error-reporter/
RUN npm install

# ビルド
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY packages/error-reporter ./packages/error-reporter
COPY apps/backend ./apps/backend
COPY turbo.json ./

# error-reporterをビルド
WORKDIR /app/packages/error-reporter
RUN npm run build

# backendをビルド
WORKDIR /app/apps/backend
RUN npm run build

# 実行環境
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# 必要なファイルのみコピー
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/package.json ./
COPY --from=builder /app/packages/error-reporter/dist ../packages/error-reporter/dist
COPY --from=builder /app/packages/error-reporter/package.json ../packages/error-reporter/
COPY --from=deps /app/node_modules ./node_modules

EXPOSE 3001

CMD ["node", "dist/index.js"]
