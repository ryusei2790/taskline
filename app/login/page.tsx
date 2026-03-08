'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/common/Button';

export default function LoginPage() {
  const { user, isLoading, signInWithMagicLink } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSending(true);
    try {
      await signInWithMagicLink(email);
      setIsSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-blue-600">TaskLine</h1>
          <p className="text-gray-500 text-sm mt-1">インデントからガントチャートを自動生成</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {isSent ? (
            <div className="text-center">
              <p className="text-gray-700 font-medium">メールを確認してください</p>
              <p className="text-gray-500 text-sm mt-2">
                <strong>{email}</strong> にログインリンクを送信しました。
                メール内のリンクをクリックしてログインしてください。
              </p>
              <button
                onClick={() => setIsSent(false)}
                className="mt-4 text-sm text-blue-600 hover:underline"
              >
                別のメールアドレスで試す
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  メールアドレス
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <Button type="submit" disabled={isSending} className="w-full">
                {isSending ? '送信中...' : 'マジックリンクを送信'}
              </Button>
            </form>
          )}
        </div>

        <p className="text-center mt-4 text-sm text-gray-500">
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            ログインせずに体験する →
          </Link>
        </p>
      </div>
    </div>
  );
}
