'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useProjects } from '@/hooks/useProjects';
import { Header } from '@/components/common/Header';
import { Button } from '@/components/common/Button';

export default function NewProjectPage() {
  const router = useRouter();
  const { createProject } = useProjects();
  const [title, setTitle] = useState('');
  const [deadlineStr, setDeadlineStr] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !deadlineStr) return;

    setError('');
    setIsCreating(true);
    try {
      const deadline = new Date(`${deadlineStr}T00:00:00`);
      const project = await createProject({ title: title.trim(), deadline });
      router.push(`/projects/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'プロジェクトの作成に失敗しました');
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-8">
        <div className="mb-6">
          <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
            ← ダッシュボードに戻る
          </Link>
        </div>
        <h1 className="text-xl font-bold mb-6">新規プロジェクト</h1>

        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              プロジェクト名 <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: 新機能開発"
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">
              期日 <span className="text-red-500">*</span>
            </label>
            <input
              id="deadline"
              type="date"
              value={deadlineStr}
              onChange={(e) => setDeadlineStr(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isCreating || !title.trim() || !deadlineStr}>
              {isCreating ? '作成中...' : 'プロジェクトを作成'}
            </Button>
            <Link href="/dashboard">
              <Button type="button" variant="secondary">キャンセル</Button>
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
