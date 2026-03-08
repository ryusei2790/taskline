import type { Task } from '@/types';
import type { ITaskRepository } from '@/repositories/types';
import { loadTasks, saveTasks } from './serializers';

/** localStorage を使ったタスクリポジトリ実装 */
export class LocalStorageTaskRepository implements ITaskRepository {
  async findByProjectId(projectId: string): Promise<Task[]> {
    const tasks = loadTasks();
    return tasks
      .filter((t) => t.projectId === projectId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  async findById(id: string): Promise<Task | null> {
    const tasks = loadTasks();
    return tasks.find((t) => t.id === id) ?? null;
  }

  async create(data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const tasks = loadTasks();
    const now = new Date();
    const task: Task = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    tasks.push(task);
    saveTasks(tasks);
    return task;
  }

  async createBatch(data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<Task[]> {
    const existingTasks = loadTasks();
    const now = new Date();
    const newTasks: Task[] = data.map((d) => ({
      ...d,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    }));
    saveTasks([...existingTasks, ...newTasks]);
    return newTasks;
  }

  async update(
    id: string,
    data: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Task> {
    const tasks = loadTasks();
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) throw new Error(`Task not found: ${id}`);
    const updated: Task = {
      ...tasks[index],
      ...data,
      updatedAt: new Date(),
    };
    tasks[index] = updated;
    saveTasks(tasks);
    return updated;
  }

  async deleteByProjectId(projectId: string): Promise<void> {
    const tasks = loadTasks();
    saveTasks(tasks.filter((t) => t.projectId !== projectId));
  }

  async delete(id: string): Promise<void> {
    const tasks = loadTasks();
    saveTasks(tasks.filter((t) => t.id !== id));
  }
}
