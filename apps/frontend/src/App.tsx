import './services/errorReporter';
import { useTodos } from './hooks/useTodos';
import { TodoForm } from './components/TodoForm';
import { TodoList } from './components/TodoList';
import { api } from './services/api';

function App() {
  const { todos, loading, error, addTodo, toggleTodo, deleteTodo, reload } = useTodos();

  const triggerTestError = async () => {
    try {
      await api.triggerError();
    } catch (err) {
      console.error('Test error triggered:', err);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', color: '#333', marginBottom: '0.5rem' }}>
          📝 DevSonar TODO App
        </h1>
        <p style={{ color: '#666' }}>AI監視付きTODOアプリ</p>
      </header>

      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
        <button
          onClick={triggerTestError}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#ff9800',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          🔥 バックエンドエラーをテスト
        </button>
        <button
          onClick={() => {
            throw new Error('Frontend test error: undefined is not a function');
          }}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          💥 フロントエンドエラーをテスト
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: '1rem',
            marginBottom: '1rem',
            backgroundColor: '#ffebee',
            color: '#c62828',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{error}</span>
          <button
            onClick={reload}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#c62828',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            再試行
          </button>
        </div>
      )}

      <TodoForm onAdd={addTodo} />

      {loading ? (
        <p style={{ textAlign: 'center', color: '#666' }}>読み込み中...</p>
      ) : (
        <TodoList todos={todos} onToggle={toggleTodo} onDelete={deleteTodo} />
      )}
    </div>
  );
}

export default App;
