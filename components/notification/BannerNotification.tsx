'use client';

import { useState, useEffect } from 'react';
import type { Task } from '@/types';
import { addBusinessDays, isSameDay } from '@/utils/dateUtils';

interface BannerNotificationProps {
  tasks: Task[];
}

/** 翌営業日開始のタスクがある場合に表示する通知バナー */
export function BannerNotification({ tasks }: BannerNotificationProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const key = `taskline:notification:dismissed:${new Date().toDateString()}`;
    if (sessionStorage.getItem(key)) {
      setIsDismissed(true);
    }
  }, []);

  // 明日（次の営業日）開始のタスクを抽出
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = addBusinessDays(today, 1);

  const tomorrowTasks = tasks.filter(
    (t) => t.startDate && isSameDay(t.startDate, tomorrow)
  );

  if (isDismissed || tomorrowTasks.length === 0) return null;

  const handleDismiss = () => {
    const key = `taskline:notification:dismissed:${new Date().toDateString()}`;
    sessionStorage.setItem(key, '1');
    setIsDismissed(true);
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-md px-4 py-3 flex items-start justify-between text-sm">
      <div className="text-blue-800">
        <p className="font-medium mb-1">明日開始予定のタスクがあります</p>
        <ul className="list-disc list-inside space-y-0.5">
          {tomorrowTasks.map((t) => (
            <li key={t.id}>{t.title}</li>
          ))}
        </ul>
      </div>
      <button
        onClick={handleDismiss}
        className="ml-4 text-blue-500 hover:text-blue-700 flex-shrink-0 mt-0.5"
        aria-label="閉じる"
      >
        ✕
      </button>
    </div>
  );
}
