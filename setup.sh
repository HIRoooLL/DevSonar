#!/bin/bash

set -e

echo "🔊 DevSonar セットアップスクリプト"
echo ""

# .envファイルのコピー
echo "📝 環境変数ファイルを作成中..."

if [ ! -f apps/relay-server/.env ]; then
  cp apps/relay-server/.env.example apps/relay-server/.env
  echo "  ✓ apps/relay-server/.env"
fi

if [ ! -f apps/backend/.env ]; then
  cp apps/backend/.env.example apps/backend/.env
  echo "  ✓ apps/backend/.env"
fi

if [ ! -f apps/frontend/.env ]; then
  cp apps/frontend/.env.example apps/frontend/.env
  echo "  ✓ apps/frontend/.env"
fi

echo ""
echo "📦 依存関係をインストール中..."
npm install

echo ""
echo "🔨 エラーレポーターパッケージをビルド中..."
npm run build --workspace=packages/error-reporter

echo ""
echo "✅ セットアップ完了！"
echo ""
echo "次のコマンドで起動できます："
echo ""
echo "  # Docker Composeで起動（推奨）"
echo "  docker-compose up -d"
echo ""
echo "  # ローカルで起動"
echo "  npm run dev"
echo ""
echo "アプリケーションURL："
echo "  - Frontend: http://localhost:3000"
echo "  - Backend:  http://localhost:3001"
echo "  - Relay:    http://localhost:9100"
echo ""
