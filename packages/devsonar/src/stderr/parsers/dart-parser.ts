import type { LanguageParser, ParsedError } from '../types.js';

export class DartParser implements LanguageParser {
  readonly language = 'dart';

  isErrorStart(line: string): boolean {
    // Unhandled exception from Dart runtime
    if (line === 'Unhandled exception:') return true;

    // Flutter framework exception block (═══ Exception caught by widgets library ═══)
    if (/^═+ Exception caught by .+ ═+$/.test(line)) return true;

    // Dart compile error (lib/main.dart:10:5: Error: something)
    if (/^\S+\.dart:\d+:\d+: Error:/.test(line)) return true;

    // Hot reload rejected
    if (line === 'Hot reload was rejected:') return true;

    return false;
  }

  isContinuation(line: string, linesSoFar: string[]): boolean {
    const firstLine = linesSoFar[0] ?? '';

    // Flutter framework exception block: continue until closing ═══ line
    if (/^═+ Exception caught by/.test(firstLine)) {
      // If this line is a closing separator (all ═ chars, 10+ long)
      if (/^═{10,}$/.test(line)) {
        // Continue only if no closing separator has been seen yet in linesSoFar
        return !linesSoFar.some(l => /^═{10,}$/.test(l));
      }
      return true;
    }

    // Unhandled exception: continue for stack frames and error details
    if (firstLine === 'Unhandled exception:') {
      if (/^#\d+\s+/.test(line)) return true; // Stack frame like #0, #1, etc.
      if (/^(Receiver|Tried calling):/.test(line)) return true; // NoSuchMethodError details
      if (linesSoFar.length < 3) return true; // Error message lines
      // Only allow empty lines if the previous line was a stack frame
      const lastLine = linesSoFar[linesSoFar.length - 1] ?? '';
      if (line === '' && /^#\d+\s+/.test(lastLine)) return true;
      return false;
    }

    // Compile error / Hot reload: continue for code snippets and carets
    if (/^\S+\.dart:\d+:\d+: Error:/.test(firstLine) || firstLine === 'Hot reload was rejected:') {
      if (/^\s{2,}/.test(line)) return true; // Indented code snippet
      if (/^\s*\^+\s*$/.test(line)) return true; // Caret line (^^^)
      // Only allow one consecutive empty line
      const lastLine = linesSoFar[linesSoFar.length - 1] ?? '';
      if (line === '' && lastLine.trim() !== '') return true;
      return false;
    }

    return false;
  }

  parse(lines: string[]): ParsedError {
    const rawLines = lines.slice();
    const firstLine = lines[0] ?? '';

    let errorType = 'UnknownError';
    let message = '';

    // Flutter framework exception
    if (/^═+ Exception caught by/.test(firstLine)) {
      // Extract library name from first line: "Exception caught by widgets library"
      const libMatch = firstLine.match(/Exception caught by (.+?) ═/);
      const library = libMatch ? libMatch[1] : 'unknown library';
      errorType = `FlutterError (${library})`;

      // Message is from lines between first separator and stack/closing separator
      const messageLines: string[] = [];
      for (let i = 1; i < lines.length; i++) {
        if (/^═{10,}$/.test(lines[i])) break;
        if (/^#\d+\s+/.test(lines[i])) break;
        if (lines[i].trim() !== '') {
          messageLines.push(lines[i].trim());
        }
      }
      message = messageLines.join(' ');
    }
    // Unhandled exception
    else if (firstLine === 'Unhandled exception:') {
      // Second line typically has the error type and message
      const errorLine = lines[1]?.trim() ?? '';
      const colonIndex = errorLine.indexOf(': ');
      if (colonIndex !== -1) {
        errorType = errorLine.substring(0, colonIndex);
        message = errorLine.substring(colonIndex + 2);
      } else {
        errorType = errorLine || 'UnknownError';
      }
    }
    // Compile error (file.dart:line:col: Error: message)
    else if (/^\S+\.dart:\d+:\d+: Error:/.test(firstLine)) {
      errorType = 'CompileError';
      const match = firstLine.match(/^\S+\.dart:\d+:\d+: Error: (.+)/);
      message = match ? match[1] : firstLine;
    }
    // Hot reload rejected
    else if (firstLine === 'Hot reload was rejected:') {
      errorType = 'HotReloadRejected';
      message = lines.slice(1).map(l => l.trim()).filter(l => l !== '').join(' ');
    }

    return {
      language: this.language,
      errorType,
      message,
      stack: rawLines.join('\n'),
      rawLines,
    };
  }
}
