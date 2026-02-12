import { ErrorReport, ErrorReporterConfig } from './types';

/**
 * エラーレポーター
 *
 * エラー情報を中継サーバーに送信する。
 * fire-and-forgetで送信し、アプリケーションの処理をブロックしない。
 */
export class ErrorReporter {
  private config: Required<ErrorReporterConfig>;

  constructor(config: ErrorReporterConfig = {}) {
    this.config = {
      relayUrl: config.relayUrl || 'http://localhost:9100',
      enabled: config.enabled !== undefined ? config.enabled : process.env.NODE_ENV === 'development',
      timeout: config.timeout || 1000,
      maxStackLength: config.maxStackLength || 2000,
      debug: config.debug || false,
    };
  }

  /**
   * エラーを中継サーバーに送信
   */
  async report(error: Error | ErrorReport, source?: string): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    const report = this.normalizeError(error, source);

    // fire-and-forget: 送信結果を待たない
    this.sendToRelay(report).catch((err) => {
      if (this.config.debug) {
        console.error('[ErrorReporter] Failed to send error to relay server:', err);
      }
    });
  }

  /**
   * エラーを正規化してErrorReport形式に変換
   */
  private normalizeError(error: Error | ErrorReport, source?: string): ErrorReport {
    if (this.isErrorReport(error)) {
      return error;
    }

    let stack = error.stack || '';
    if (stack.length > this.config.maxStackLength) {
      stack = stack.substring(0, this.config.maxStackLength) + '\n... (truncated)';
    }

    return {
      message: error.message,
      stack,
      source,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 中継サーバーにPOST送信
   */
  private async sendToRelay(report: ErrorReport): Promise<void> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(`${this.config.relayUrl}/errors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Relay server responded with status ${response.status}`);
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private isErrorReport(obj: any): obj is ErrorReport {
    return obj && typeof obj === 'object' && 'message' in obj && 'timestamp' in obj;
  }
}

/**
 * グローバルエラーレポーターインスタンス
 */
let globalReporter: ErrorReporter | null = null;

/**
 * グローバルエラーレポーターを初期化
 */
export function initErrorReporter(config?: ErrorReporterConfig): ErrorReporter {
  globalReporter = new ErrorReporter(config);
  return globalReporter;
}

/**
 * グローバルエラーレポーターを取得
 */
export function getErrorReporter(): ErrorReporter {
  if (!globalReporter) {
    throw new Error('ErrorReporter not initialized. Call initErrorReporter() first.');
  }
  return globalReporter;
}

/**
 * エラーを報告（簡易ヘルパー）
 */
export function reportError(error: Error | ErrorReport, source?: string): void {
  if (globalReporter) {
    globalReporter.report(error, source);
  }
}
