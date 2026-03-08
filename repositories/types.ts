import type { Project, Task } from '@/types';

/** プロジェクト永続化層のインターフェース */
export interface IProjectRepository {
  findAll(): Promise<Project[]>;
  findById(id: string): Promise<Project | null>;
  create(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project>;
  update(id: string, data: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Project>;
  delete(id: string): Promise<void>;
}

/** タスク永続化層のインターフェース */
export interface ITaskRepository {
  findByProjectId(projectId: string): Promise<Task[]>;
  findById(id: string): Promise<Task | null>;
  create(data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task>;
  /** 複数タスクを一括作成（「生成」ボタン押下時に使用） */
  createBatch(data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<Task[]>;
  update(id: string, data: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Task>;
  deleteByProjectId(projectId: string): Promise<void>;
  delete(id: string): Promise<void>;
}
