/**
 * エラーレポート情報の型定義
 */
export interface ErrorReport {
  /** エラーメッセージ（必須） */
  message: string;
  /** スタックトレース（任意） */
  stack?: string;
  /** 発生元情報（例: 'POST /api/users'） */
  source?: string;
  /** 発生タイムスタンプ（ISO8601形式） */
  timestamp: string;
  /** 追加のコンテキスト情報 */
  context?: Record<string, any>;
}

/**
 * エラーレポーター設定
 */
export interface ErrorReporterConfig {
  /** 中継サーバーのURL（デフォルト: http://localhost:9100） */
  relayUrl?: string;
  /** 開発環境でのみ有効化（デフォルト: true） */
  enabled?: boolean;
  /** 送信タイムアウト（ミリ秒、デフォルト: 1000） */
  timeout?: number;
  /** スタックトレースの最大文字数（デフォルト: 2000） */
  maxStackLength?: number;
  /** 送信失敗時のログ出力（デフォルト: false） */
  debug?: boolean;
}
