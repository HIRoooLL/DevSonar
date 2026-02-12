# 🔊 DevSonar

ローカル開発環境のランタイムエラーをAIエージェント（Claude Code CLI）に自動送信し、リアルタイムで解析・修正提案を得るシステム。

## 🎯 概要

**DevSonar**は、フロントエンド・バックエンドで発生したエラーを自動検知し、AIエージェントに送信してソースコード解析と修正案の提案を受けられるツールです。

### システム構成

```
┌─────────────┐       ┌─────────────┐
│  Frontend   │       │  Backend    │
│ (React)     │       │ (Express)   │
└──────┬──────┘       └──────┬──────┘
       │                     │
       │ エラー発生時         │
       │ POST /errors        │
       ▼                     ▼
┌──────────────────────────────────┐
│   AI Error Relay Server          │
│   - バッファリング                │
│   - デバウンス（3秒）             │
└──────────────┬───────────────────┘
               │
               │ 構造化プロンプト送信
               ▼
┌──────────────────────────────────┐
│   Claude Code CLI                │
│   - エラー解析                    │
│   - ソースコード参照              │
│   - 修正案提案                    │
└──────────────────────────────────┘
```

## 🚀 クイックスタート

### 前提条件

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Docker** & **Docker Compose**（Docker使用の場合）
- **Claude Code CLI**（`claude`コマンドが使用可能であること）

### Docker Composeで起動（推奨）

```bash
# 1. リポジトリをクローン
cd DevSonar

# 2. 依存関係をインストール
npm install

# 3. Docker Composeで全サービスを起動
docker-compose up -d

# 4. ログを確認
docker-compose logs -f
```

**起動完了！** 以下のURLにアクセスできます：

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Relay Server**: http://localhost:9100

### ローカル環境で起動（開発用）

```bash
# 1. 依存関係をインストール
npm install

# 2. 各サービスの.envファイルを作成
cp apps/relay-server/.env.example apps/relay-server/.env
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env

# 3. エラーレポーターパッケージをビルド
npm run build --workspace=packages/error-reporter

# 4. Turbo Repoで全サービスを起動
npm run dev
```

または、個別に起動：

```bash
# ターミナル1: 中継サーバー
npm run relay

# ターミナル2: バックエンド
npm run backend

# ターミナル3: フロントエンド
npm run frontend
```

## 📦 プロジェクト構成

```
DevSonar/
├── apps/
│   ├── relay-server/      # AI Error Relay中継サーバー
│   ├── backend/           # Express.js TODO API
│   └── frontend/          # React TODOアプリ
├── packages/
│   └── error-reporter/    # エラーレポーター共通パッケージ
├── docker-compose.yml     # Docker Compose設定
├── turbo.json             # Turbo Repo設定
└── package.json           # ルートパッケージ
```

## 🧪 エラー送信のテスト

### フロントエンドエラー

1. http://localhost:3000 にアクセス
2. 「💥 フロントエンドエラーをテスト」ボタンをクリック
3. エラーが中継サーバー経由でClaude Code CLIに送信される

### バックエンドエラー

1. http://localhost:3000 にアクセス
2. 「🔥 バックエンドエラーをテスト」ボタンをクリック
3. エラーが中継サーバー経由でClaude Code CLIに送信される

または、直接APIを呼び出し：

```bash
curl http://localhost:3001/api/error
```

### エラー送信フロー確認

```bash
# 中継サーバーのヘルスチェック
curl http://localhost:9100/health

# バッファされているエラー件数を確認
# { "status": "ok", "buffered": 0, "target": "claude-code" }

# 強制フラッシュ（テスト用）
curl -X POST http://localhost:9100/flush
```

## ⚙️ 設定

### 環境変数

#### Relay Server（`apps/relay-server/.env`）

| 変数名 | デフォルト | 説明 |
|---|---|---|
| `RELAY_PORT` | `9100` | 中継サーバーのポート |
| `RELAY_TARGET` | `claude-code` | 送信先AIエージェント |
| `DEBOUNCE_MS` | `3000` | デバウンス間隔（ミリ秒） |
| `MAX_BUFFER_SIZE` | `50` | バッファ上限 |
| `MAX_STACK_LENGTH` | `2000` | スタックトレース送信上限文字数 |
| `CLAUDE_SESSION_ID` | - | Claude Code CLIセッションID（任意） |

#### Backend API（`apps/backend/.env`）

| 変数名 | デフォルト | 説明 |
|---|---|---|
| `PORT` | `3001` | バックエンドAPIのポート |
| `ERROR_REPORTER_ENABLED` | `true` | エラーレポーター有効化 |
| `RELAY_URL` | `http://localhost:9100` | 中継サーバーURL |

#### Frontend（`apps/frontend/.env`）

| 変数名 | デフォルト | 説明 |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3001/api` | バックエンドAPI URL |
| `VITE_RELAY_URL` | `http://localhost:9100` | 中継サーバーURL |
| `VITE_ERROR_REPORTER_ENABLED` | `true` | エラーレポーター有効化 |

## 🔧 開発コマンド

```bash
# 全サービスを開発モードで起動
npm run dev

# 全サービスをビルド
npm run build

# 全サービスをクリーン
npm run clean

# 個別サービスを起動
npm run relay      # 中継サーバー
npm run backend    # バックエンド
npm run frontend   # フロントエンド
```

## 🐳 Dockerコマンド

```bash
# 全サービスをビルド&起動
docker-compose up -d

# ログを表示
docker-compose logs -f

# 特定のサービスのログを表示
docker-compose logs -f relay-server
docker-compose logs -f backend
docker-compose logs -f frontend

# 停止
docker-compose down

# 再ビルド
docker-compose up -d --build

# 完全削除（ボリューム含む）
docker-compose down -v
```

## 📚 API仕様

### Relay Server

#### `POST /errors`

エラーレポートを受信。

**リクエスト**:
```json
{
  "message": "Error message",
  "stack": "Stack trace...",
  "source": "POST /api/users",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "context": {
    "method": "POST",
    "path": "/api/users"
  }
}
```

**レスポンス**: `202 Accepted`
```json
{
  "received": 1
}
```

#### `GET /health`

ヘルスチェック。

**レスポンス**:
```json
{
  "status": "ok",
  "buffered": 0,
  "target": "claude-code"
}
```

### Backend API

#### `GET /api/todos`

全てのTODOを取得。

#### `POST /api/todos`

TODOを作成。

**リクエスト**:
```json
{
  "title": "新しいTODO"
}
```

#### `PATCH /api/todos/:id`

TODOを更新。

#### `DELETE /api/todos/:id`

TODOを削除。

#### `GET /api/error`

テスト用エラーエンドポイント。

## 🎨 カスタマイズ

### 独自のアプリにエラーレポーターを統合

#### バックエンド（Express.js）

```typescript
import { initErrorReporter, errorReporterMiddleware } from '@devsonar/error-reporter';

const errorReporter = initErrorReporter({
  relayUrl: 'http://localhost:9100',
  enabled: process.env.NODE_ENV === 'development',
});

app.use(errorReporterMiddleware(errorReporter));
```

#### フロントエンド（React/Vue/etc）

```typescript
const errorReporter = new ErrorReporter({
  relayUrl: 'http://localhost:9100',
  enabled: import.meta.env.DEV,
});

// グローバルエラーハンドラー
window.addEventListener('error', (event) => {
  errorReporter.report(event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  errorReporter.report(new Error(event.reason));
});
```

## 🚧 トラブルシューティング

### エラーがClaude Code CLIに送信されない

1. Claude Code CLIが正しくインストールされているか確認
   ```bash
   claude --version
   ```

2. 中継サーバーのログを確認
   ```bash
   docker-compose logs -f relay-server
   ```

3. 環境変数 `RELAY_TARGET` が `claude-code` に設定されているか確認

### バックエンド/フロントエンドが中継サーバーに接続できない

1. 中継サーバーが起動しているか確認
   ```bash
   curl http://localhost:9100/health
   ```

2. 各サービスの `RELAY_URL` / `VITE_RELAY_URL` が正しいか確認

## 📄 ライセンス

MIT

## 🤝 貢献

Issue・PRを歓迎します！
