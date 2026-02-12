import { Todo } from './types';

/**
 * インメモリTODOストア
 */
class TodoStore {
  private todos: Map<string, Todo> = new Map();
  private idCounter = 1;

  /**
   * 全てのTODOを取得
   */
  findAll(): Todo[] {
    return Array.from(this.todos.values());
  }

  /**
   * IDでTODOを取得
   */
  findById(id: string): Todo | undefined {
    return this.todos.get(id);
  }

  /**
   * TODOを作成
   */
  create(title: string): Todo {
    const id = String(this.idCounter++);
    const todo: Todo = {
      id,
      title,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    this.todos.set(id, todo);
    return todo;
  }

  /**
   * TODOを更新
   */
  update(id: string, updates: Partial<Todo>): Todo | undefined {
    const todo = this.todos.get(id);
    if (!todo) {
      return undefined;
    }

    const updated = { ...todo, ...updates };
    this.todos.set(id, updated);
    return updated;
  }

  /**
   * TODOを削除
   */
  delete(id: string): boolean {
    return this.todos.delete(id);
  }
}

export const todoStore = new TodoStore();
