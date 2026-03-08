'use client';

import { useEffect, useRef } from 'react';
import type { Task } from '@/types';
import { formatDateYMD } from '@/utils/dateUtils';

type ViewMode = 'Day' | 'Week' | 'Month';

interface GanttChartProps {
  tasks: Task[];
  viewMode?: ViewMode;
}

/**
 * frappe-gantt を使ったガントチャートコンポーネント
 * frappe-gantt は window に依存するため dynamic import + ssr: false で使用すること
 */
export function GanttChart({ tasks, viewMode = 'Day' }: GanttChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const displayTasks = tasks.filter((t) => t.startDate && t.endDate);
    if (displayTasks.length === 0) return;

    const ganttTasks = displayTasks.map((t) => ({
      id: t.id,
      name: t.title,
      start: formatDateYMD(t.startDate!),
      end: formatDateYMD(t.endDate!),
      progress: t.progress,
      custom_class: t.isHourBased ? 'hour-based-task' : '',
    }));

    import('frappe-gantt').then((module) => {
      const Gantt = module.default;
      if (!containerRef.current) return;

      // date_format は各 view_mode のデフォルトに任せるため指定しない
      // popup は新 API（ctx ベース）を使用
      new Gantt(containerRef.current, ganttTasks, {
        view_mode: viewMode,
        language: 'en',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        popup: (ctx: any) => {
          const original = displayTasks.find((t) => t.id === ctx.task.id);
          ctx.set_title(ctx.task.name);
          if (original?.isHourBased && original.estimatedHours) {
            ctx.set_subtitle(`所要時間: ${original.estimatedHours}時間`);
          } else {
            ctx.set_subtitle('');
          }
        },
      } as never);
    });

    return () => {
      container.innerHTML = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, viewMode]);

  return (
    <div className="overflow-x-auto">
      <div ref={containerRef} className="gantt-container" />
    </div>
  );
}

/**
 * プロジェクトの期間に応じて適切なガントチャートのスケールを自動選択する
 */
export function getAutoViewMode(totalDays: number): ViewMode {
  if (totalDays <= 30) return 'Day';
  if (totalDays <= 90) return 'Week';
  return 'Month';
}
