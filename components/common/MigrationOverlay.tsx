'use client';

import { LoadingSpinner } from './LoadingSpinner';

/** マイグレーション中に表示するオーバーレイ */
export function MigrationOverlay() {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4">
      <LoadingSpinner size="lg" />
      <p className="text-gray-700 font-medium">ローカルデータをクラウドに移行中...</p>
      <p className="text-gray-500 text-sm">しばらくお待ちください</p>
    </div>
  );
}
