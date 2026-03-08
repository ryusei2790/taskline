'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { AuthGuard } from '@/components/common/AuthGuard';
import { Header } from '@/components/common/Header';
import { Button } from '@/components/common/Button';
import { useRouter } from 'next/navigation';

function SettingsContent() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (err) {
      console.error('Sign out failed:', err);
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
        <h1 className="text-xl font-bold mb-6">設定</h1>

        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700">メールアドレス</p>
            <p className="text-gray-900 mt-1">{user?.email}</p>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <Button variant="danger" onClick={handleSignOut}>
              ログアウト
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <AuthGuard>
      <SettingsContent />
    </AuthGuard>
  );
}
