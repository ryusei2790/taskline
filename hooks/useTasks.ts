'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Task, ScheduleResult } from '@/types';
import { useRepository } from '@/repositories/RepositoryContext';
import { parseIndentText } from '@/utils/indentParser';
import { calculateSchedule, scheduledTasksToFlat } from '@/lib/scheduleCalc';

interface UseTasksResult {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  generateFromText: (text: string, deadline: Date) => Promise<ScheduleResult>;
  updateTask: (id: string, data: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  refreshTasks: () => Promise<void>;
}

/**
 * 指定プロジェクトのタスク操作を提供するカスタムフック
 * @param projectId 対象プロジェクト ID
 */
export function useTasks(projectId: string): UseTasksResult {
  const { projectRepo, taskRepo } = useRepository();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshTasks = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await taskRepo.findByProjectId(projectId);
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'タスクの読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [taskRepo, projectId]);

  useEffect(() => {
    refreshTasks();
  }, [refreshTasks]);

  /**
   * インデントテキストからスケジュールを生成して保存する
   * 1. テキストをパース → スケジュール計算
   * 2. 既存タスクを削除 → 新規タスクを一括保存
   * 3. プロジェクトの rawInput を更新
   */
  const generateFromText = async (text: string, deadline: Date): Promise<ScheduleResult> => {
    const nodes = parseIndentText(text);
    if (nodes.length === 0) {
      throw new Error('タスクが入力されていません');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = calculateSchedule(nodes, deadline, today);

    // 全スケジュールタスクをフラット化
    const flatTasks = scheduledTasksToFlat(result.tasks, projectId, null);

    // 既存タスクを削除してから一括保存
    await taskRepo.deleteByProjectId(projectId);
    const savedTasks = await taskRepo.createBatch(flatTasks);

    // プロジェクトの rawInput を更新
    await projectRepo.update(projectId, { rawInput: text });

    setTasks(savedTasks.sort((a, b) => a.orderIndex - b.orderIndex));
    return result;
  };

  const updateTask = async (
    id: string,
    data: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<void> => {
    const updated = await taskRepo.update(id, data);
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
  };

  const deleteTask = async (id: string): Promise<void> => {
    await taskRepo.delete(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  return {
    tasks,
    isLoading,
    error,
    generateFromText,
    updateTask,
    deleteTask,
    refreshTasks,
  };
}
