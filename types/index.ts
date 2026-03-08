/** タスクのステータス */
export type TaskStatus = 'todo' | 'in_progress' | 'done';

/** アプリケーション内でのプロジェクト型 */
export interface Project {
  id: string;
  /** 認証済み: Supabase UUID / 未認証: "__local__" */
  ownerId: string;
  title: string;
  deadline: Date;
  /** テキストエリアの原文（スケジュール再生成に使用） */
  rawInput: string;
  createdAt: Date;
  updatedAt: Date;
}

/** アプリケーション内でのタスク型 */
export interface Task {
  id: string;
  projectId: string;
  parentId: string | null;
  title: string;
  orderIndex: number;
  /** 推定工数（日数）。小数対応（[4h] → 0.5） */
  estimatedDays: number;
  /** [Nh] 記法の元の時間数。日数指定の場合は null */
  estimatedHours: number | null;
  /** true の場合、[Nh] 記法で入力されたタスク */
  isHourBased: boolean;
  startDate: Date | null;
  endDate: Date | null;
  status: TaskStatus;
  /** 進捗率 0-100 */
  progress: number;
  memo: string;
  createdAt: Date;
  updatedAt: Date;
}

/** インデントパーサーが生成する中間表現（木構造ノード） */
export interface TaskNode {
  title: string;
  estimatedDays: number;
  estimatedHours: number | null;
  isHourBased: boolean;
  children: TaskNode[];
}

/** スケジュール計算後のタスクノード */
export interface ScheduledTask extends TaskNode {
  startDate: Date;
  endDate: Date;
  /** フラット変換時に使用する順序インデックス */
  orderIndex: number;
}

/** スケジュール計算の結果 */
export interface ScheduleResult {
  tasks: ScheduledTask[];
  /** 工数が期日内に収まらず圧縮された場合 true */
  isCompressed: boolean;
  /** 全タスクの合計日数 */
  totalDays: number;
  /** 今日〜期日の営業日数 */
  availableDays: number;
}
