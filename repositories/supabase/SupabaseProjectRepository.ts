import type { SupabaseClient } from '@supabase/supabase-js';
import type { Project } from '@/types';
import type { IProjectRepository } from '@/repositories/types';
import { rawToProject, projectToRaw, type RawSupabaseProject } from './utils';

/** Supabase を使ったプロジェクトリポジトリ実装 */
export class SupabaseProjectRepository implements IProjectRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findAll(): Promise<Project[]> {
    const { data, error } = await this.client
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data as RawSupabaseProject[]).map(rawToProject);
  }

  async findById(id: string): Promise<Project | null> {
    const { data, error } = await this.client
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null; // not found
      throw new Error(error.message);
    }
    return rawToProject(data as RawSupabaseProject);
  }

  async create(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    const { data: inserted, error } = await this.client
      .from('projects')
      .insert(projectToRaw(data))
      .select()
      .single();
    if (error) throw new Error(error.message);
    return rawToProject(inserted as RawSupabaseProject);
  }

  async update(
    id: string,
    data: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Project> {
    const rawData: Partial<ReturnType<typeof projectToRaw>> = {};
    if (data.title !== undefined) rawData.title = data.title;
    if (data.deadline !== undefined) {
      const y = data.deadline.getFullYear();
      const m = String(data.deadline.getMonth() + 1).padStart(2, '0');
      const d = String(data.deadline.getDate()).padStart(2, '0');
      rawData.deadline = `${y}-${m}-${d}`;
    }
    if (data.rawInput !== undefined) rawData.raw_input = data.rawInput;

    const { data: updated, error } = await this.client
      .from('projects')
      .update(rawData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return rawToProject(updated as RawSupabaseProject);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from('projects').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }
}
