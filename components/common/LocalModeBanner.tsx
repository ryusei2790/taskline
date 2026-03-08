'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

/** 未ログイン時に表示するローカルモードの告知バナー */
export function LocalModeBanner() {
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const key = `taskline:local-banner:dismissed:${new Date().toDateString()}`;
    if (sessionStorage.getItem(key)) {
      setIsDismissed(true);
    }
  }, []);

  if (isDismissed) return null;

  const handleDismiss = () => {
    const key = `taskline:local-banner:dismissed:${new Date().toDateString()}`;
    sessionStorage.setItem(key, '1');
    setIsDismissed(true);
  };

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between text-sm">
      <p className="text-amber-800">
        現在ローカルモードで動作中です。データはこのブラウザにのみ保存されます。{' '}
        <Link href="/login" className="underline font-medium hover:text-amber-900">
          ログイン
        </Link>
        するとクラウドに保存され、どこからでもアクセスできます。
      </p>
      <button
        onClick={handleDismiss}
        className="ml-4 text-amber-600 hover:text-amber-800 flex-shrink-0"
        aria-label="閉じる"
      >
        ✕
      </button>
    </div>
  );
}
