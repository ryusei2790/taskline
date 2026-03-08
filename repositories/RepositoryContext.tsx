'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { IProjectRepository, ITaskRepository } from './types';
import { LocalStorageProjectRepository } from './localStorage/LocalStorageProjectRepository';
import { LocalStorageTaskRepository } from './localStorage/LocalStorageTaskRepository';
import { SupabaseProjectRepository } from './supabase/SupabaseProjectRepository';
import { SupabaseTaskRepository } from './supabase/SupabaseTaskRepository';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface RepositoryContextValue {
  projectRepo: IProjectRepository;
  taskRepo: ITaskRepository;
}

const RepositoryContext = createContext<RepositoryContextValue | null>(null);

/** 認証状態に応じて localStorage ↔ Supabase リポジトリを自動切り替えするプロバイダー */
export function RepositoryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const projectRepo = useMemo<IProjectRepository>(
    () =>
      user
        ? new SupabaseProjectRepository(supabase)
        : new LocalStorageProjectRepository(),
    [user]
  );

  const taskRepo = useMemo<ITaskRepository>(
    () =>
      user
        ? new SupabaseTaskRepository(supabase)
        : new LocalStorageTaskRepository(),
    [user]
  );

  return (
    <RepositoryContext.Provider value={{ projectRepo, taskRepo }}>
      {children}
    </RepositoryContext.Provider>
  );
}

/** リポジトリを取得するカスタムフック */
export function useRepository(): RepositoryContextValue {
  const ctx = useContext(RepositoryContext);
  if (!ctx) throw new Error('useRepository must be used within RepositoryProvider');
  return ctx;
}
