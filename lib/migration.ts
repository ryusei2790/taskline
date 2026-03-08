import type { IProjectRepository, ITaskRepository } from '@/repositories/types';
import { loadProjects, loadTasks, LS_KEYS } from '@/repositories/localStorage/serializers';

/**
 * localStorage のデータを Supabase に移行する
 * ログイン成功時に一度だけ呼び出される
 *
 * @param userId 認証済みユーザーの UUID
 * @param projectRepo Supabase プロジェクトリポジトリ
 * @param taskRepo Supabase タスクリポジトリ
 */
export async function migrateLocalDataToSupabase(
  userId: string,
  projectRepo: IProjectRepository,
  taskRepo: ITaskRepository
): Promise<void> {
  const localProjects = loadProjects();
  const localTasks = loadTasks();

  if (localProjects.length === 0) return;

  // 旧 ID → 新 ID のマッピング Map
  const projectIdMap = new Map<string, string>();

  // プロジェクトを Supabase に移行
  for (const project of localProjects) {
    const created = await projectRepo.create({
      ownerId: userId,
      title: project.title,
      deadline: project.deadline,
      rawInput: project.rawInput,
    });
    projectIdMap.set(project.id, created.id);
  }

  // タスクを Supabase に移行（プロジェクト ID を新しい ID にマッピング）
  const migratedTasks = localTasks
    .filter((t) => projectIdMap.has(t.projectId))
    .map((t) => ({
      projectId: projectIdMap.get(t.projectId)!,
      parentId: t.parentId, // Phase 1 では parentId は null のため変換不要
      title: t.title,
      orderIndex: t.orderIndex,
      estimatedDays: t.estimatedDays,
      estimatedHours: t.estimatedHours,
      isHourBased: t.isHourBased,
      startDate: t.startDate,
      endDate: t.endDate,
      status: t.status,
      progress: t.progress,
      memo: t.memo,
    }));

  if (migratedTasks.length > 0) {
    await taskRepo.createBatch(migratedTasks);
  }

  // localStorage をクリア
  localStorage.removeItem(LS_KEYS.PROJECTS);
  localStorage.removeItem(LS_KEYS.TASKS);
  localStorage.removeItem(LS_KEYS.META_VERSION);
}

/**
 * localStorage にローカルデータが存在するかどうかを確認する
 */
export function hasLocalData(): boolean {
  const raw = localStorage.getItem(LS_KEYS.PROJECTS);
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0;
  } catch {
    return false;
  }
}
