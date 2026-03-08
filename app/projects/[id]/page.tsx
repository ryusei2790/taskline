'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { Header } from '@/components/common/Header';
import { Button } from '@/components/common/Button';
import { LoadingPage, LoadingSpinner } from '@/components/common/LoadingSpinner';
import { TaskEditor } from '@/components/task/TaskEditor';
import { BannerNotification } from '@/components/notification/BannerNotification';
import { getAutoViewMode } from '@/components/gantt/GanttChart';
import type { ScheduleResult } from '@/types';
import { countBusinessDays } from '@/utils/dateUtils';

// frappe-gantt は window に依存するため SSR を無効にして動的インポート
const GanttChart = dynamic(
  () => import('@/components/gantt/GanttChart').then((m) => m.GanttChart),
  { ssr: false, loading: () => <div className="flex justify-center py-8"><LoadingSpinner /></div> }
);

type TabType = 'tasks' | 'gantt';
type ViewMode = 'Day' | 'Week' | 'Month';

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const { projects, isLoading: projectsLoading } = useProjects();
  const { tasks, isLoading: tasksLoading, generateFromText } = useTasks(params.id);
  const [activeTab, setActiveTab] = useState<TabType>('tasks');
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [scheduleResult, setScheduleResult] = useState<ScheduleResult | null>(null);
  const [generateError, setGenerateError] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('Day');

  const project = projects.find((p) => p.id === params.id);

  // rawInput の復元
  useEffect(() => {
    if (project?.rawInput) {
      setInputText(project.rawInput);
    }
  }, [project?.rawInput]);

  // ガントチャートのスケール自動設定
  useEffect(() => {
    if (project) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const days = countBusinessDays(today, project.deadline);
      setViewMode(getAutoViewMode(days));
    }
  }, [project]);

  const handleGenerate = async () => {
    if (!project || !inputText.trim()) return;
    setGenerateError('');
    setIsGenerating(true);
    try {
      const result = await generateFromText(inputText, project.deadline);
      setScheduleResult(result);
      setActiveTab('gantt');
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'スケジュール生成に失敗しました');
    } finally {
      setIsGenerating(false);
    }
  };

  if (projectsLoading) return <LoadingPage />;

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500">プロジェクトが見つかりません</p>
            <Link href="/dashboard" className="mt-2 inline-block text-blue-600 hover:underline text-sm">
              ダッシュボードに戻る
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        {/* プロジェクトヘッダー */}
        <div className="mb-4">
          <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
            ← ダッシュボード
          </Link>
          <h1 className="text-xl font-bold mt-2">{project.title}</h1>
          <p className="text-sm text-gray-500">期日: {project.deadline.toLocaleDateString('ja-JP')}</p>
        </div>

        {/* 通知バナー */}
        {tasks.length > 0 && (
          <div className="mb-4">
            <BannerNotification tasks={tasks} />
          </div>
        )}

        {/* タブ */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-6">
            {(['tasks', 'gantt'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'tasks' ? 'タスクリスト' : 'ガントチャート'}
              </button>
            ))}
          </nav>
        </div>

        {/* タスクリストタブ */}
        {activeTab === 'tasks' && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                インデントでタスクの階層を表現してください。
                <span className="font-mono bg-gray-100 px-1 rounded">[3d]</span> で3日、
                <span className="font-mono bg-gray-100 px-1 rounded">[4h]</span> で4時間を指定できます。
              </p>
              <TaskEditor
                value={inputText}
                onChange={setInputText}
                placeholder={`例:\n要件定義 [2d]\n設計\n  DB設計 [3d]\n  API設計 [2d]\n実装\n  フロントエンド [5d]\n  バックエンド [4d]\nテスト [3d]`}
                disabled={isGenerating}
              />
            </div>

            {generateError && (
              <p className="text-red-600 text-sm">{generateError}</p>
            )}

            {scheduleResult?.isCompressed && (
              <div className="bg-amber-50 border border-amber-200 rounded-md px-4 py-3 text-sm text-amber-800">
                ⚠ 合計工数（{scheduleResult.totalDays.toFixed(1)}日）が残り営業日数（{scheduleResult.availableDays}日）を超えているため、スケジュールを圧縮しました。
              </div>
            )}

            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !inputText.trim()}
            >
              {isGenerating ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  生成中...
                </span>
              ) : (
                'スケジュールを生成'
              )}
            </Button>
          </div>
        )}

        {/* ガントチャートタブ */}
        {activeTab === 'gantt' && (
          <div>
            {tasksLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : tasks.filter((t) => t.startDate && t.endDate).length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p>スケジュールがまだ生成されていません</p>
                <button
                  onClick={() => setActiveTab('tasks')}
                  className="mt-2 text-sm text-blue-600 hover:underline"
                >
                  タスクリストタブで生成してください
                </button>
              </div>
            ) : (
              <div>
                {/* スケール切替 */}
                <div className="flex gap-2 mb-4">
                  {(['Day', 'Week', 'Month'] as ViewMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        viewMode === mode
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {mode === 'Day' ? '日' : mode === 'Week' ? '週' : '月'}
                    </button>
                  ))}
                </div>
                <GanttChart tasks={tasks} viewMode={viewMode} />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
