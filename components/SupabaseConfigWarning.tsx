import React from 'react';

/**
 * Supabase 接続設定不足警告コンポーネント (Requirement 15)
 * 
 * `.env.local` に Supabase の接続情報が設定されていない場合に表示されます。
 */
export function SupabaseConfigWarning() {
  return (
    <div className="w-full max-w-3xl mx-auto p-6 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-200 space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl">⚠️</span>
        <h2 className="text-xl font-bold text-amber-400">Supabase 接続設定不足</h2>
      </div>
      <p className="text-sm leading-relaxed text-slate-300">
        `.env.local` に Supabase の接続環境変数が設定されていないか、値が空です。
        以下の手順で環境変数を設定してください。
      </p>
      
      <div className="bg-slate-900/80 p-4 rounded-xl font-mono text-xs text-slate-300 border border-slate-800 space-y-2 overflow-x-auto">
        <p className="text-slate-400"># .env.local に以下を設定してください</p>
        <p><span className="text-indigo-400">NEXT_PUBLIC_SUPABASE_URL</span>=https://your-project.supabase.co</p>
        <p><span className="text-indigo-400">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</span>=your-anon-or-publishable-key</p>
      </div>

      <div className="text-xs text-slate-400 pt-2 border-t border-amber-500/20 flex flex-col gap-1">
        <p>💡 設定完了後、開発サーバーを再起動 (`npm run dev`) してください。</p>
        <p>💡 SQLスキーマの作成方法は `supabase/README.md` をご確認ください。</p>
      </div>
    </div>
  );
}
