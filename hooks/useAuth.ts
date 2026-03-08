'use client';

import { useState, useEffect, createContext, useContext, type ReactNode } from 'react';
import { createElement } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { migrateLocalDataToSupabase, hasLocalData } from '@/lib/migration';
import { SupabaseProjectRepository } from '@/repositories/supabase/SupabaseProjectRepository';
import { SupabaseTaskRepository } from '@/repositories/supabase/SupabaseTaskRepository';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isMigrating: boolean;
  signInWithMagicLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** 認証状態を管理するプロバイダー */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);

  useEffect(() => {
    // 初期セッション取得
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // 認証状態の変化をリッスン
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const newUser = session?.user ?? null;
        setUser(newUser);
        setIsLoading(false);

        // ログイン時: localStorage にデータがあればマイグレーション実行
        if (event === 'SIGNED_IN' && newUser && hasLocalData()) {
          setIsMigrating(true);
          try {
            const projectRepo = new SupabaseProjectRepository(supabase);
            const taskRepo = new SupabaseTaskRepository(supabase);
            await migrateLocalDataToSupabase(newUser.id, projectRepo, taskRepo);
          } catch (err) {
            console.error('Migration failed:', err);
          } finally {
            setIsMigrating(false);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signInWithMagicLink = async (email: string): Promise<void> => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw new Error(error.message);
  };

  const signOut = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  };

  return createElement(
    AuthContext.Provider,
    { value: { user, isLoading, isMigrating, signInWithMagicLink, signOut } },
    children
  );
}

/** 認証状態を取得するカスタムフック */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
