import type { Task, TaskNode, ScheduledTask, ScheduleResult } from '@/types';
import { subtractBusinessDays, countBusinessDays } from '@/utils/dateUtils';

/** 末端タスク（葉ノード）の合計推定日数を再帰的に計算する */
function sumLeafDays(nodes: TaskNode[]): number {
  let total = 0;
  for (const node of nodes) {
    if (node.children.length === 0) {
      total += node.estimatedDays;
    } else {
      total += sumLeafDays(node.children);
    }
  }
  return total;
}

/**
 * 末端ノードの estimatedDays を圧縮率で調整する（破壊的変更）
 * - 日数ベースタスク: 最低 1 日
 * - 時間ベースタスク: 最低 1 時間（= 1/8 日）
 */
function applyCompression(nodes: TaskNode[], ratio: number): void {
  for (const node of nodes) {
    if (node.children.length === 0) {
      const minDays = node.isHourBased ? 1 / 8 : 1;
      node.estimatedDays = Math.max(minDays, node.estimatedDays * ratio);
    } else {
      applyCompression(node.children, ratio);
    }
  }
}

/**
 * ノードに対してスケジュールを逆算で割り当てる（再帰）
 * endDate を基準に各タスクの startDate / endDate を決定する
 */
function assignDates(node: TaskNode, endDate: Date, orderRef: { index: number }): ScheduledTask {
  if (node.children.length === 0) {
    // 葉ノード: endDate から estimatedDays 日前を startDate とする
    const startDate = subtractBusinessDays(endDate, node.estimatedDays - 1);
    const scheduled: ScheduledTask = {
      ...node,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      orderIndex: orderRef.index++,
    };
    return scheduled;
  }

  // 親ノード: 子を逆順に処理（最後の子が endDate を持つ）
  const scheduledChildren: ScheduledTask[] = [];
  let currentEnd = new Date(endDate);

  for (let i = node.children.length - 1; i >= 0; i--) {
    const childScheduled = assignDates(node.children[i], currentEnd, orderRef);
    scheduledChildren.unshift(childScheduled);
    // 次の子（1つ前）の endDate = 現在の子の startDate の前営業日
    if (i > 0) {
      currentEnd = subtractBusinessDays(childScheduled.startDate, 1);
    }
  }

  // 親の startDate = 最初の子の startDate、endDate = 最後の子の endDate
  const parentStartDate = scheduledChildren[0].startDate;
  const parentEndDate = scheduledChildren[scheduledChildren.length - 1].endDate;

  const scheduled: ScheduledTask = {
    ...node,
    children: scheduledChildren,
    startDate: new Date(parentStartDate),
    endDate: new Date(parentEndDate),
    orderIndex: orderRef.index++,
  };
  return scheduled;
}

/**
 * TaskNode 木構造にスケジュールを割り当て ScheduleResult を返す
 *
 * @param roots ルートレベルの TaskNode 配列
 * @param deadline プロジェクト期日
 * @param today 今日の日付（圧縮判定用）
 */
export function calculateSchedule(
  roots: TaskNode[],
  deadline: Date,
  today: Date
): ScheduleResult {
  // Deep copy して元データを変更しない
  const clonedRoots: TaskNode[] = JSON.parse(JSON.stringify(roots));

  const totalDays = sumLeafDays(clonedRoots);
  const availableDays = countBusinessDays(today, deadline);

  let isCompressed = false;
  if (totalDays > availableDays && availableDays > 0) {
    const ratio = availableDays / totalDays;
    applyCompression(clonedRoots, ratio);
    isCompressed = true;
  }

  // ルートを逆順に処理して endDate = deadline から逆算
  const scheduledRoots: ScheduledTask[] = [];
  const orderRef = { index: 0 };
  let currentEnd = new Date(deadline);

  for (let i = clonedRoots.length - 1; i >= 0; i--) {
    const scheduled = assignDates(clonedRoots[i], currentEnd, orderRef);
    scheduledRoots.unshift(scheduled);
    if (i > 0) {
      currentEnd = subtractBusinessDays(scheduled.startDate, 1);
    }
  }

  return {
    tasks: scheduledRoots,
    isCompressed,
    totalDays,
    availableDays,
  };
}

/**
 * ScheduledTask 木構造をフラットな Task 作成用データに変換する
 * orderIndex は DFS 順で付与済み
 */
export function scheduledTasksToFlat(
  nodes: ScheduledTask[],
  projectId: string,
  parentId: string | null
): Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[] {
  const results: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[] = [];

  for (const node of nodes) {
    const taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> = {
      projectId,
      parentId,
      title: node.title,
      orderIndex: node.orderIndex,
      estimatedDays: node.estimatedDays,
      estimatedHours: node.estimatedHours,
      isHourBased: node.isHourBased,
      startDate: node.startDate,
      endDate: node.endDate,
      status: 'todo',
      progress: 0,
      memo: '',
    };
    results.push(taskData);

    // 子は後で ID が必要なので一旦 null を parentId として積む
    // 実際の DB 保存時は createBatch の返り値で ID を取得して再紐付けが必要だが、
    // Phase 1 では親子関係はガントチャートで使用しないため parentId は概算で可
    if (node.children.length > 0) {
      const childResults = scheduledTasksToFlat(
        node.children as ScheduledTask[],
        projectId,
        null // Phase 1: 実 ID は保存後に取得できないため null
      );
      results.push(...childResults);
    }
  }

  return results;
}

/**
 * フラットな Task[] を TaskNode 木構造に変換する（既存タスクの再計算用）
 */
export function tasksToNodes(tasks: Task[]): TaskNode[] {
  const map = new Map<string, TaskNode & { _id: string }>();

  for (const task of tasks) {
    map.set(task.id, {
      _id: task.id,
      title: task.title,
      estimatedDays: task.estimatedDays,
      estimatedHours: task.estimatedHours,
      isHourBased: task.isHourBased,
      children: [],
    });
  }

  const roots: (TaskNode & { _id: string })[] = [];

  for (const task of tasks) {
    const node = map.get(task.id)!;
    if (task.parentId && map.has(task.parentId)) {
      map.get(task.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // _id プロパティを除いて返す
  return roots.map((n) => stripId(n));
}

function stripId(node: TaskNode & { _id?: string }): TaskNode {
  const { _id: _, ...rest } = node as TaskNode & { _id: string };
  void _;
  return {
    ...rest,
    children: node.children.map((c) => stripId(c as TaskNode & { _id?: string })),
  };
}
