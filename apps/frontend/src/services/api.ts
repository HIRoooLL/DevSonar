import { Todo } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * ネットワークエラーをユーザーフレンドリーなメッセージに変換
 */
function handleNetworkError(error: unknown, operation: string): never {
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    throw new Error(
      `サーバーに接続できません。バックエンドが起動しているか確認してください。(${operation})`
    );
  }
  throw error;
}

/**
 * リトライ付きfetch
 */
async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retries = 2,
  delay = 1000
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);
      return response;
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      // リトライ前に待機
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  // TypeScript用（到達しない）
  throw new Error('Unexpected error in fetchWithRetry');
}

/**
 * TODO API クライアント
 */
export const api = {
  /**
   * 全てのTODOを取得
   */
  async getTodos(): Promise<Todo[]> {
    try {
      const response = await fetchWithRetry(`${API_URL}/todos`);
      if (!response.ok) {
        throw new Error(`Failed to fetch todos: ${response.statusText}`);
      }
      return response.json();
    } catch (error) {
      handleNetworkError(error, 'getTodos');
    }
  },

  /**
   * TODOを作成
   */
  async createTodo(title: string): Promise<Todo> {
    try {
      const response = await fetchWithRetry(`${API_URL}/todos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      });
      if (!response.ok) {
        throw new Error(`Failed to create todo: ${response.statusText}`);
      }
      return response.json();
    } catch (error) {
      handleNetworkError(error, 'createTodo');
    }
  },

  /**
   * TODOを更新
   */
  async updateTodo(id: string, updates: Partial<Todo>): Promise<Todo> {
    try {
      const response = await fetchWithRetry(`${API_URL}/todos/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        throw new Error(`Failed to update todo: ${response.statusText}`);
      }
      return response.json();
    } catch (error) {
      handleNetworkError(error, 'updateTodo');
    }
  },

  /**
   * TODOを削除
   */
  async deleteTodo(id: string): Promise<void> {
    try {
      // BUG: DELETE ではなく POST を使っている
      const response = await fetchWithRetry(`${API_URL}/todos/${id}`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error(`Failed to delete todo: ${response.statusText}`);
      }
    } catch (error) {
      handleNetworkError(error, 'deleteTodo');
    }
  },

  /**
   * テスト用エラーエンドポイント
   */
  async triggerError(): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/error`);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Server error');
      }
    } catch (error) {
      handleNetworkError(error, 'triggerError');
    }
  },
};
