import { useState, useEffect } from 'react';
import { Todo } from '../types';
import { api } from '../services/api';

/**
 * TODO管理フック
 */
export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 初期ロード
  useEffect(() => {
    loadTodos();
  }, []);

  const loadTodos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getTodos();
      setTodos(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load todos';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async (title: string) => {
    try {
      const newTodo = await api.createTodo(title);
      setTodos((prev) => [...prev, newTodo]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create todo';
      setError(message);
    }
  };

  const toggleTodo = async (id: string) => {
    try {
      const todo = todos.find((t) => t.id === id);
      if (!todo) return;

      const updated = await api.updateTodo(id, { completed: !todo.completed });
      setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update todo';
      setError(message);
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      await api.deleteTodo(id);
      setTodos((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete todo';
      setError(message);
    }
  };

  return {
    todos,
    loading,
    error,
    addTodo,
    toggleTodo,
    deleteTodo,
    reload: loadTodos,
  };
}
