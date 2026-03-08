import type { Project } from '@/types';
import type { IProjectRepository } from '@/repositories/types';
import { loadProjects, saveProjects } from './serializers';

/** 未認証ユーザーの ownerId 定数 */
export const LOCAL_OWNER_ID = '__local__';

/** localStorage を使ったプロジェクトリポジトリ実装 */
export class LocalStorageProjectRepository implements IProjectRepository {
  async findAll(): Promise<Project[]> {
    return loadProjects();
  }

  async findById(id: string): Promise<Project | null> {
    const projects = loadProjects();
    return projects.find((p) => p.id === id) ?? null;
  }

  async create(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    const projects = loadProjects();
    const now = new Date();
    const project: Project = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    projects.push(project);
    saveProjects(projects);
    return project;
  }

  async update(
    id: string,
    data: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Project> {
    const projects = loadProjects();
    const index = projects.findIndex((p) => p.id === id);
    if (index === -1) throw new Error(`Project not found: ${id}`);
    const updated: Project = {
      ...projects[index],
      ...data,
      updatedAt: new Date(),
    };
    projects[index] = updated;
    saveProjects(projects);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const projects = loadProjects();
    saveProjects(projects.filter((p) => p.id !== id));
  }
}
