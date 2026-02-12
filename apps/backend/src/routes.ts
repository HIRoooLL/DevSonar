import { Router, Request, Response } from 'express';
import { todoStore } from './store';
import { CreateTodoDto, UpdateTodoDto } from './types';

export const router = Router();

/**
 * GET /api/todos - 全てのTODOを取得
 */
router.get('/todos', (req: Request, res: Response) => {
  const todos = todoStore.findAll();
  res.json(todos);
});

/**
 * GET /api/todos/:id - 特定のTODOを取得
 */
router.get('/todos/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const todo = todoStore.findById(id);

  if (!todo) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  res.json(todo);
});

/**
 * POST /api/todos - TODOを作成
 */
router.post('/todos', (req: Request, res: Response) => {
  const { title } = req.body as CreateTodoDto;

  if (typeof title !== 'string') {
    throw new TypeError(`Expected title to be string, but got ${typeof title}: ${JSON.stringify(title)}`);
  }

  if (!title || title.trim() === '') {
    return res.status(400).json({ error: 'Title is required' });
  }

  const todo = todoStore.create(title);
  res.status(201).json(todo);
});

/**
 * PATCH /api/todos/:id - TODOを更新
 */
router.patch('/todos/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body as UpdateTodoDto;

  const todo = todoStore.update(id, updates);

  if (!todo) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  res.json(todo);
});

/**
 * DELETE /api/todos/:id - TODOを削除
 */
router.delete('/todos/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = todoStore.delete(id);

  if (!deleted) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  res.status(204).send();
});

/**
 * GET /api/error - テスト用エラーエンドポイント
 */
router.get('/error', (req: Request, res: Response) => {
  throw new Error('This is a test error from backend API');
});
