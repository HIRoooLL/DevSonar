import type { LanguageParser, ParsedError } from '../types.js';

export class GoParser implements LanguageParser {
  readonly language = 'go';

  isErrorStart(line: string): boolean {
    // Direct panic: "panic: runtime error: ..."
    if (line.startsWith('panic:')) return true;
    // net/http recovery: "2026/01/01 12:00:00 http: panic serving [::1]:8080: runtime error: ..."
    if (/http: panic serving .+: /.test(line)) return true;
    return false;
  }

  isContinuation(line: string, _linesSoFar: string[]): boolean {
    if (line.startsWith('goroutine ')) return true;
    if (line.startsWith('\t')) return true;
    if (line === '') return true;
    if (/^\S+\.\S+\(/.test(line)) return true;
    if (/^created by /.test(line)) return true;
    return false;
  }

  parse(lines: string[]): ParsedError {
    const rawLines = lines.slice();
    const firstLine = lines[0] ?? '';

    let message: string;
    // net/http format: "2026/01/01 12:00:00 http: panic serving [::1]:8080: runtime error: ..."
    const httpPanicMatch = firstLine.match(/http: panic serving .+?: (.+)/);
    if (httpPanicMatch) {
      message = httpPanicMatch[1];
    } else if (firstLine.startsWith('panic: ')) {
      message = firstLine.substring('panic: '.length);
    } else {
      message = firstLine;
    }

    return {
      language: this.language,
      errorType: 'panic',
      message,
      stack: rawLines.join('\n'),
      rawLines,
    };
  }
}
