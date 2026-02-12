import { ErrorReporter } from './reporter/reporter.js';

/**
 * DevSonar 自動登録モジュール
 *
 * node --import devsonar/register app.js
 * または devsonar run -- <command> で自動的に読み込まれる。
 */

const reporter = new ErrorReporter({
  relayUrl: process.env.DEVSONAR_URL || 'http://localhost:9100',
  enabled: true,
  debug: process.env.DEVSONAR_DEBUG === 'true',
});

process.on('uncaughtException', (error: Error) => {
  reporter.report(error, 'uncaughtException');
  console.error('[DevSonar] Captured uncaughtException:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  const error = reason instanceof Error ? reason : new Error(String(reason));
  reporter.report(error, 'unhandledRejection');
  console.error('[DevSonar] Captured unhandledRejection:', error);
});

console.log('[DevSonar] Error monitoring active (relay: ' + (process.env.DEVSONAR_URL || 'http://localhost:9100') + ')');
