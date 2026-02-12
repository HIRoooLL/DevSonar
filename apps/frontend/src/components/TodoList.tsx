import { Todo } from '../types';

interface TodoListProps {
  todos: Todo[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TodoList({ todos, onToggle, onDelete }: TodoListProps) {
  if (todos.length === 0) {
    return <p style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>TODOがありません</p>;
  }

  return (
    <ul style={{ listStyle: 'none', padding: 0 }}>
      {todos.map((todo) => (
        <li
          key={todo.id}
          style={{
            padding: '1rem',
            marginBottom: '0.5rem',
            backgroundColor: '#f9f9f9',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => onToggle(todo.id)}
            style={{ cursor: 'pointer', width: '20px', height: '20px' }}
          />
          <span
            style={{
              flex: 1,
              textDecoration: todo.completed ? 'line-through' : 'none',
              color: todo.completed ? '#999' : '#333',
            }}
          >
            {todo.title}
          </span>
          <button
            onClick={() => onDelete(todo.id)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#ff4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            削除
          </button>
        </li>
      ))}
    </ul>
  );
}
