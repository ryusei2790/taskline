'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from './Button';

export function Header() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="text-lg font-bold text-blue-600 hover:text-blue-700">
          TaskLine
        </Link>
        <nav className="flex items-center gap-3">
          {user ? (
            <>
              <Link href="/settings" className="text-sm text-gray-600 hover:text-gray-900">
                設定
              </Link>
              <Button variant="secondary" onClick={handleSignOut}>
                ログアウト
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button variant="primary">ログイン</Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
