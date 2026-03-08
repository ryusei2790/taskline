import type { SupabaseClient } from '@supabase/supabase-js';
import type { Task } from '@/types';
import type { ITaskRepository } from '@/repositories/types';
import { rawToTask, taskToRaw, type RawSupabaseTask } from './utils';

/** Supabase を使ったタスクリポジトリ実装 */
export class SupabaseTaskRepository implements ITaskRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findByProjectId(projectId: string): Promise<Task[]> {
    const { data, error } = await this.client
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true });
    if (error) throw new Error(error.message);
    return (data as RawSupabaseTask[]).map(rawToTask);
  }

  async findById(id: string): Promise<Task | null> {
    const { data, error } = await this.client
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return rawToTask(data as RawSupabaseTask);
  }

  async create(data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const { data: inserted, error } = await this.client
      .from('tasks')
      .insert(taskToRaw(data))
      .select()
      .single();
    if (error) throw new Error(error.message);
    return rawToTask(inserted as RawSupabaseTask);
  }

  async createBatch(data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<Task[]> {
    if (data.length === 0) return [];
    const { data: inserted, error } = await this.client
      .from('tasks')
      .insert(data.map(taskToRaw))
      .select();
    if (error) throw new Error(error.message);
    return (inserted as RawSupabaseTask[]).map(rawToTask);
  }

  async update(
    id: string,
    data: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Task> {
    const { data: updated, error } = await this.client
      .from('tasks')
      .update(taskToRaw(data as Omit<Task, 'id' | 'createdAt' | 'updatedAt'>))
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return rawToTask(updated as RawSupabaseTask);
  }

  async deleteByProjectId(projectId: string): Promise<void> {
    const { error } = await this.client.from('tasks').delete().eq('project_id', projectId);
    if (error) throw new Error(error.message);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from('tasks').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }
}
