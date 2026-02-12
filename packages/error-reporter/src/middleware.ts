import { Request, Response, NextFunction } from 'express';
import { ErrorReporter } from './reporter';

/**
 * Express用エラーハンドリングミドルウェア
 *
 * 未捕捉のエラーをキャッチして中継サーバーに送信する。
 * アプリケーションのエラーレスポンスをブロックせず、
 * 通常のエラーハンドリングと並行して動作する。
 */
export function errorReporterMiddleware(reporter: ErrorReporter) {
  return (err: Error, req: Request, res: Response, next: NextFunction) => {
    const source = `${req.method} ${req.path}`;

    // エラーを中継サーバーに送信（fire-and-forget）
    reporter.report({
      message: err.message,
      stack: err.stack,
      source,
      timestamp: new Date().toISOString(),
      context: {
        method: req.method,
        path: req.path,
        query: req.query,
        body: req.body,
        headers: req.headers,
      },
    });

    // 次のエラーハンドラーに処理を渡す
    next(err);
  };
}
