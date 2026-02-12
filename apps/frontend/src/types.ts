export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

export interface ErrorReport {
  message: string;
  stack?: string;
  source?: string;
  timestamp: string;
  context?: Record<string, any>;
}
