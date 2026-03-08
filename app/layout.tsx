import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/hooks/useAuth';
import { RepositoryProvider } from '@/repositories/RepositoryContext';

export const metadata: Metadata = {
  title: 'TaskLine',
  description: 'インデントリストからガントチャートを自動生成するタスク管理アプリ',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        {/* frappe-gantt CSS (public/にコピーしたもの) */}
        <link rel="stylesheet" href="/frappe-gantt.css" />
      </head>
      <body className="bg-gray-50 text-gray-900 antialiased">
        <AuthProvider>
          <RepositoryProvider>
            {children}
          </RepositoryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
