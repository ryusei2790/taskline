import type { Project, Task, TaskStatus } from '@/types';
import { parseDateLocal } from '@/utils/dateUtils';

/** Supabase から返される projects テーブルの生データ型 */
export interface RawSupabaseProject {
  id: string;
  owner_id: string;
  title: string;
  deadline: string;
  raw_input: string;
  created_at: string;
  updated_at: string;
}

/** Supabase から返される tasks テーブルの生データ型 */
export interface RawSupabaseTask {
  id: string;
  project_id: string;
  parent_id: string | null;
  title: string;
  order_index: number;
  estimated_days: string | number;
  estimated_hours: string | number | null;
  is_hour_based: boolean;
  start_date: string | null;
  end_date: string | null;
  status: string;
  progress: number;
  memo: string;
  created_at: string;
  updated_at: string;
}

/** Supabase の生データを Project 型に変換する */
export function rawToProject(raw: RawSupabaseProject): Project {
  return {
    id: raw.id,
    ownerId: raw.owner_id,
    title: raw.title,
    deadline: parseDateLocal(raw.deadline),
    rawInput: raw.raw_input,
    createdAt: new Date(raw.created_at),
    updatedAt: new Date(raw.updated_at),
  };
}

/** Project 型を Supabase insert/update 用のスネークケースオブジェクトに変換する */
export function projectToRaw(
  data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>
): Omit<RawSupabaseProject, 'id' | 'created_at' | 'updated_at'> {
  return {
    owner_id: data.ownerId,
    title: data.title,
    deadline: formatDateForDB(data.deadline),
    raw_input: data.rawInput,
  };
}

/** Supabase の生データを Task 型に変換する */
export function rawToTask(raw: RawSupabaseTask): Task {
  return {
    id: raw.id,
    projectId: raw.project_id,
    parentId: raw.parent_id,
    title: raw.title,
    orderIndex: raw.order_index,
    estimatedDays: Number(raw.estimated_days),
    estimatedHours: raw.estimated_hours !== null ? Number(raw.estimated_hours) : null,
    isHourBased: raw.is_hour_based,
    startDate: raw.start_date ? parseDateLocal(raw.start_date) : null,
    endDate: raw.end_date ? parseDateLocal(raw.end_date) : null,
    status: raw.status as TaskStatus,
    progress: raw.progress,
    memo: raw.memo,
    createdAt: new Date(raw.created_at),
    updatedAt: new Date(raw.updated_at),
  };
}

/** Task 型を Supabase insert/update 用のスネークケースオブジェクトに変換する */
export function taskToRaw(
  data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>
): Omit<RawSupabaseTask, 'id' | 'created_at' | 'updated_at'> {
  return {
    project_id: data.projectId,
    parent_id: data.parentId,
    title: data.title,
    order_index: data.orderIndex,
    estimated_days: data.estimatedDays,
    estimated_hours: data.estimatedHours,
    is_hour_based: data.isHourBased,
    start_date: data.startDate ? formatDateForDB(data.startDate) : null,
    end_date: data.endDate ? formatDateForDB(data.endDate) : null,
    status: data.status,
    progress: data.progress,
    memo: data.memo,
  };
}

/** Date を "YYYY-MM-DD" 形式に変換（Supabase DATE 型用） */
function formatDateForDB(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
