'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/hooks/useProjects';
import { Header } from '@/components/common/Header';
import { LocalModeBanner } from '@/components/common/LocalModeBanner';
import { MigrationOverlay } from '@/components/common/MigrationOverlay';
import { Button } from '@/components/common/Button';
import { LoadingPage } from '@/components/common/LoadingSpinner';
import type { Project } from '@/types';

export default function DashboardPage() {
  const { user, isMigrating } = useAuth();
  const { projects, isLoading, deleteProject } = useProjects();
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (project: Project) => {
    if (!confirm(`「${project.title}」を削除しますか？この操作は取り消せません。`)) return;
    setDeletingId(project.id);
    try {
      await deleteProject(project.id);
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) return <LoadingPage />;

  return (
    <>
      {isMigrating && <MigrationOverlay />}
      <div className="min-h-screen flex flex-col">
        {!user && <LocalModeBanner />}
        <Header />
        <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold">プロジェクト一覧</h1>
            <Link href="/projects/new">
              <Button>+ 新規プロジェクト</Button>
            </Link>
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-lg">プロジェクトがまだありません</p>
              <p className="text-sm mt-1">「新規プロジェクト」から作成してください</p>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:border-blue-300 transition-colors"
                >
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => router.push(`/projects/${project.id}`)}
                  >
                    <h2 className="font-medium text-gray-900">{project.title}</h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                      期日: {project.deadline.toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="secondary"
                      onClick={() => router.push(`/projects/${project.id}`)}
                    >
                      開く
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleDelete(project)}
                      disabled={deletingId === project.id}
                    >
                      削除
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
