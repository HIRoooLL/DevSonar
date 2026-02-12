import { exec } from 'child_process';
import { promisify } from 'util';
import { query } from '@anthropic-ai/claude-agent-sdk';
import { ErrorReport, RelayConfig } from './types.js';
import { SessionManager } from './session-manager.js';

const execAsync = promisify(exec);

export class AIClient {
  constructor(
    private config: RelayConfig,
    private sessionManager: SessionManager,
  ) {}

  async send(errors: ErrorReport[]): Promise<void> {
    const prompt = this.buildPrompt(errors);

    console.log(`[AI Client] === Prompt ===\n${prompt}\n[AI Client] === End Prompt ===`);

    if (this.config.claudeMode === 'sdk') {
      await this.sendViaSDK(prompt);
    } else {
      await this.sendViaCLI(prompt);
    }
  }

  private buildPrompt(errors: ErrorReport[]): string {
    const errorCount = errors.length;
    const timestamp = new Date().toISOString();

    let prompt = `# ランタイムエラー検出 (${errorCount}件)\n\n`;
    prompt += `**タイムスタンプ**: ${timestamp}\n\n`;
    prompt += `以下のエラーが検出されました。**プロジェクトのソースコードを参照して、原因を特定し、修正を行ってください。**\n\n`;

    errors.forEach((error, index) => {
      prompt += `## エラー ${index + 1}/${errorCount}\n\n`;
      prompt += `**メッセージ**: \`${error.message}\`\n\n`;
      if (error.source) {
        prompt += `**発生元**: ${error.source}\n\n`;
      }
      if (error.stack) {
        const stack = this.truncateStack(error.stack);
        prompt += `**スタックトレース**:\n\`\`\`\n${stack}\n\`\`\`\n\n`;
      }
      if (error.context) {
        const contextStr = JSON.stringify(error.context, null, 2);
        if (contextStr.length < 1000) {
          prompt += `**コンテキスト**:\n\`\`\`json\n${contextStr}\n\`\`\`\n\n`;
        }
      }
      prompt += `---\n\n`;
    });

    prompt += `\n**次のアクションを実行してください**:\n\n`;
    prompt += `1. 各エラーのスタックトレースから発生箇所を特定\n`;
    prompt += `2. 該当するソースコードファイルを読み込む\n`;
    prompt += `3. エラーの根本原因を分析\n`;
    prompt += `4. 修正案を提示し、可能であればコードを修正\n`;
    prompt += `5. 修正が完了したら \`git diff\` を出力して変更内容を報告\n\n`;
    prompt += `**注意**: \`git add\` や \`git commit\` は絶対に実行しないでください。変更はステージングせず、差分の確認のみ行ってください。\n\n`;

    return prompt;
  }

  private truncateStack(stack: string): string {
    if (stack.length <= this.config.maxStackLength) {
      return stack;
    }
    return stack.substring(0, this.config.maxStackLength) + '\n... (truncated)';
  }

  private async sendViaSDK(prompt: string): Promise<void> {
    try {
      await this.executeSDKQuery(prompt);
    } catch (error) {
      const sessionId = this.sessionManager.getSessionId();
      if (sessionId) {
        console.warn(`[AI Client] Resume failed for session ${sessionId}, retrying with new session...`);
        await this.sessionManager.reset();
        await this.executeSDKQuery(prompt);
      } else {
        throw error;
      }
    }
  }

  private async executeSDKQuery(prompt: string): Promise<void> {
    const sessionId = this.sessionManager.getSessionId();
    console.log(`[AI Client] Sending via Agent SDK...`);
    console.log(`[AI Client] Session ID: ${sessionId || 'new session'}`);

    for await (const message of query({
      prompt,
      options: {
        cwd: this.config.projectDir,
        permissionMode: 'bypassPermissions',
        allowDangerouslySkipPermissions: true,
        maxTurns: 30,
        ...(sessionId ? { resume: sessionId } : {}),
      },
    })) {
      console.log(`[AI Client] SDK message: type=${message.type} subtype=${(message as any).subtype || '-'}`);
      if (message.type === 'system' && message.subtype === 'init') {
        await this.sessionManager.saveSessionId((message as any).session_id);
      }
      if (message.type === 'assistant') {
        const msg = message as any;
        const text = Array.isArray(msg.content)
          ? msg.content.map((b: any) => b.text || '').join('')
          : msg.message?.content || JSON.stringify(msg);
        console.log(`[AI Client] === AI Response ===\n${text}\n[AI Client] === End AI Response ===`);
      }
      if (message.type === 'result') {
        console.log(`[AI Client] === Result ===\n${(message as any).result}\n[AI Client] === End Result ===`);
      }
    }

    console.log(`[AI Client] Successfully sent via Agent SDK`);
  }

  private async sendViaCLI(prompt: string): Promise<void> {
    try {
      const sessionId = this.sessionManager.getSessionId();
      const escapedPrompt = prompt.replace(/'/g, "'\\''");
      const resumeFlag = sessionId ? `--resume ${sessionId}` : '';
      const command = `echo '${escapedPrompt}' | claude -p --dangerously-skip-permissions ${resumeFlag}`;

      console.log(`[AI Client] Sending to Claude Code CLI...`);
      console.log(`[AI Client] Session ID: ${sessionId || 'new session'}`);

      const { stdout, stderr } = await execAsync(command, {
        cwd: this.config.projectDir,
        maxBuffer: 20 * 1024 * 1024,
        timeout: 300000,
      });

      if (stderr) {
        console.error(`[AI Client] Claude Code stderr:`, stderr);
      }
      if (stdout) {
        console.log(`[AI Client] === AI Response ===\n${stdout}\n[AI Client] === End AI Response ===`);
      }

      console.log(`[AI Client] Successfully sent to Claude Code CLI`);
    } catch (error) {
      console.error(`[AI Client] Failed to send to Claude Code:`, error);
      throw error;
    }
  }
}
