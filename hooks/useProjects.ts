'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Project } from '@/types';
import { useRepository } from '@/repositories/RepositoryContext';
import { useAuth } from './useAuth';

interface UseProjectsResult {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  createProject: (data: { title: string; deadline: Date }) => Promise<Project>;
  updateProject: (id: string, data: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  refreshProjects: () => Promise<void>;
}

/** プロジェクトの CRUD 操作を提供するカスタムフック */
export function useProjects(): UseProjectsResult {
  const { projectRepo } = useRepository();
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await projectRepo.findAll();
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'プロジェクトの読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [projectRepo]);

  // リポジトリ（認証状態）が変わったら再取得
  useEffect(() => {
    refreshProjects();
  }, [refreshProjects, user]);

  const createProject = async (data: { title: string; deadline: Date }): Promise<Project> => {
    const ownerId = user?.id ?? '__local__';
    const project = await projectRepo.create({
      ...data,
      ownerId,
      rawInput: '',
    });
    setProjects((prev) => [project, ...prev]);
    return project;
  };

  const updateProject = async (
    id: string,
    data: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<void> => {
    const updated = await projectRepo.update(id, data);
    setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
  };

  const deleteProject = async (id: string): Promise<void> => {
    await projectRepo.delete(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  return {
    projects,
    isLoading,
    error,
    createProject,
    updateProject,
    deleteProject,
    refreshProjects,
  };
}
