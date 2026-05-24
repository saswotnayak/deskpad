import { useState, useEffect } from 'react';
import { useUser } from '../../hooks/useUser';
import { useAuth } from '../../hooks/useAuth';
import { useSettings } from '../../hooks/useSettings';
import './TodoPage.css';

interface TodoItem {
  id: string;
  title: string;
  completed: boolean;
  category: string;
  dueDate?: string;
}

interface TodoPageProps {
  onOpenSettings: () => void;
}

export function TodoPage({ onOpenSettings }: TodoPageProps) {
  const { activeUser } = useUser();
  const { token } = useAuth();
  const { settings } = useSettings();
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTodos = async () => {
    if (!token) return;
    const userId = activeUser?.id || 1;
    try {
      const res = await fetch(`/api/todos?user_id=${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        throw new Error('Failed to load tasks from server');
      }
      const data = await res.json();
      const activeTasks: TodoItem[] = data.todos || [];

      setTodos((prev) => {
        // Keep locally completed tasks in state so they do not disappear on background poll
        const previouslyCompleted = prev.filter((t) => completedIds.has(t.id));
        const merged = [...previouslyCompleted];
        const mergedIds = new Set(merged.map((t) => t.id));

        // Add active tasks (ensuring we mark them completed if locally checked)
        activeTasks.forEach((task) => {
          if (completedIds.has(task.id)) {
            if (!mergedIds.has(task.id)) {
              merged.push({ ...task, completed: true });
              mergedIds.add(task.id);
            }
          } else {
            if (!mergedIds.has(task.id)) {
              merged.push(task);
              mergedIds.add(task.id);
            }
          }
        });

        return merged;
      });
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error connecting to backend');
    } finally {
      setLoading(false);
    }
  };

  // Reset local state on user switch
  useEffect(() => {
    setCompletedIds(new Set());
    setTodos([]);
  }, [activeUser?.id]);

  useEffect(() => {
    fetchTodos();
    // Poll for changes every 30 seconds to keep display fresh
    const interval = setInterval(fetchTodos, 30000);
    return () => clearInterval(interval);
  }, [activeUser?.id, completedIds]);

  // 1. ONBOARDING VIEW (No token set)
  if (!settings.todoistApiToken?.trim()) {
    const mockTasks = [
      { id: 'mock-1', title: 'Plan weekly sprint goals', category: 'Work' },
      { id: 'mock-2', title: 'Buy fresh groceries', category: 'Personal' },
      { id: 'mock-3', title: 'Read 10 pages of book', category: 'Self Care' },
    ];

    return (
      <div className="todo-page onboarding">
        <div className="todo-onboarding-bg">
          {mockTasks.map(t => (
            <div key={t.id} className="mock-task-card" style={{ opacity: 0.15 }}>
              <div className="mock-task-checkbox" />
              <div className="mock-task-details">
                <span className="mock-task-title">{t.title}</span>
                <span className="mock-task-category">{t.category}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="todo-card onboarding-card fade-in">
          <div className="todo-icon-glow">
            <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" fill="none" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h2>Todoist Integration</h2>
          <p>Display your daily agenda, projects, and checklist tasks right on your smart desk dashboard.</p>
          <button className="todo-btn" onClick={onOpenSettings}>
            Configure Token
          </button>
        </div>
      </div>
    );
  }

  const handleToggle = async (id: string) => {
    if (completedIds.has(id)) return;

    const userId = activeUser?.id || 1;

    // 1. Mark completed locally and update todo items instantly
    setCompletedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: true } : t))
    );

    // 2. Commit completion back to backend
    try {
      const res = await fetch(`/api/todos/${id}/complete?user_id=${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        throw new Error('Failed to mark task completed');
      }
    } catch (err) {
      console.error('Failed to sync complete action to backend:', err);
      // Rollback on failure
      setCompletedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      fetchTodos();
    }
  };

  // Group tasks by category
  const categories = Array.from(new Set(todos.map((todo) => todo.category)));

  // Helper to filter and sort tasks per column (completed tasks moved to TOP)
  const getSortedTasks = (category: string) => {
    const categoryTasks = todos.filter((todo) => todo.category === category);
    return [...categoryTasks].sort((a, b) => {
      const aComp = a.completed || completedIds.has(a.id);
      const bComp = b.completed || completedIds.has(b.id);
      
      if (aComp && !bComp) return -1; // completed (a) comes before active (b)
      if (!aComp && bComp) return 1;  // active (a) comes after completed (b)
      return 0;
    });
  };

  return (
    <div className="todo-page">
      <header className="todo-page__header">
        <div className="todo-page__header-title-group">
          <h1 className="todo-page__title">My Agenda</h1>
          <button 
            className="todo-page__refresh-btn" 
            onClick={fetchTodos} 
            aria-label="Refresh tasks"
          >
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>
        </div>
      </header>

      {error && (
        <div className="todo-page__error">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {loading && todos.length === 0 ? (
        <div className="todo-page__loading">
          <div className="todo-page__spinner" />
          <p>Syncing with Todoist...</p>
        </div>
      ) : (
        <div className="todo-page__grid">
          {todos.length === 0 ? (
            <div className="todo-page__empty">
              <div className="todo-page__empty-icon">✓</div>
              {!settings.todoistApiToken ? (
                <>
                  <h3>Connect to Todoist</h3>
                  <p>Go to settings (gear icon) and add your Todoist API token to sync your personal tasks.</p>
                </>
              ) : (
                <>
                  <h3>All caught up!</h3>
                  <p>Create tasks in your Todoist app and they will display here.</p>
                </>
              )}
            </div>
          ) : (
            categories.map((category) => (
              <div key={category} className="todo-column">
                <h2 className="todo-column__title">{category}</h2>
                <div className="todo-column__list">
                  {getSortedTasks(category).map((todo) => (
                    <div
                      key={todo.id}
                      className={`todo-item ${todo.completed ? 'todo-item--completed' : ''}`}
                      onClick={() => !todo.completed && handleToggle(todo.id)}
                      role="button"
                      tabIndex={0}
                      aria-label={`Mark task "${todo.title}" as completed`}
                    >
                      <div className="todo-item__checkbox">
                        {todo.completed && (
                          <svg className="todo-item__check-icon" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="todo-item__text">
                        <span className="todo-item__title">{todo.title}</span>
                        {todo.dueDate && (
                          <span className="todo-item__due">
                            Due {new Date(todo.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
