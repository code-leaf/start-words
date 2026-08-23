import React from 'react';

/**
 * サーバー接続設定不足の警告コンポーネント
 *
 * `.env.local` に必要な接続情報が設定されていない場合にのみ表示される、
 * 運用上の安全弁。通常の利用フローでは表示されない。
 */
export function SupabaseConfigWarning() {
  return (
    <div className="w-full max-w-lg mx-auto p-6 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-200 space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-2xl">⚠️</span>
        <h2 className="text-lg font-bold text-amber-400">サーバー設定が未完了です</h2>
      </div>
      <p className="text-sm leading-relaxed text-slate-300">
        アプリを利用するための接続設定が完了していません。管理者にお問い合わせください。
      </p>
    </div>
  );
}
