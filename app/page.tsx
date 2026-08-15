import { createClient as createServerClient } from '@/lib/supabase/server';
import { fetchUserCards } from '@/lib/cards';
import { SupabaseConfigWarning } from '@/components/SupabaseConfigWarning';
import { MVP1Dashboard } from '@/components/MVP1Dashboard';
import { Card } from '@/types/card';
import { User } from '@supabase/supabase-js';

/**
 * MVP 1 メインページ Component (Server Component)
 * 
 * 目的:
 * - Next.js App Router の Server Component として初期レンダリングを実施。
 * - サーバー側でSupabaseの認証Cookieを検証し、初期セッションおよびカード一覧を安全にサーバーフェッチします。
 * - 環境変数未設定の場合は適切なガイドメッセージを表示します。
 */
export default async function Home() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const isConfigured = Boolean(supabaseUrl && supabaseKey);

  let initialUser: User | null = null;
  let initialCards: Card[] = [];
  let initialError: string | null = null;

  if (isConfigured) {
    try {
      const supabase = await createServerClient();
      
      // ユーザーセッション取得
      const {
        data: { user },
      } = await supabase.auth.getUser();
      initialUser = user;

      // サーバー側でカード一覧を初回取得 (RLSが自動適用されます)
      const result = await fetchUserCards(supabase);
      initialCards = result.cards;
      initialError = result.error;
    } catch (err: unknown) {
      console.error('Server initial fetch error:', err);
      initialError = 'サーバー側でのデータ取得中にエラーが発生しました';
    }
  }

  return (
    <main className='min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start p-4 sm:p-8 relative overflow-x-hidden'>
      {/* 背景グラデーション装飾 */}
      <div className='absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none' />
      <div className='absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none' />

      <div className='max-w-4xl w-full space-y-8 z-10 my-4'>
        {/* ヘッダーエリア */}
        <header className='text-center space-y-3'>
          <div className='inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold tracking-wide uppercase'>
            <span className='w-2 h-2 rounded-full bg-indigo-400 animate-pulse' />
            MVP 1 : Supabase + Cards + RLS
          </div>

          <h1 className='text-4xl sm:text-5xl font-extrabold tracking-tight bg-linear-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent'>
            start-words
          </h1>
          <p className='text-sm sm:text-base text-slate-400 max-w-xl mx-auto'>
            Supabase PostgreSQL の RLS (Row Level Security)
            によるユーザー単位のデータ制限・カード取得検証画面
          </p>
        </header>

        {/* メインコンテンツエリア */}
        {!isConfigured ? (
          <SupabaseConfigWarning />
        ) : (
          <MVP1Dashboard
            initialUser={initialUser}
            initialCards={initialCards}
            initialError={initialError}
            isConfigured={isConfigured}
          />
        )}

        {/* フッター情報 */}
        <footer className='pt-8 text-center text-xs text-slate-400 border-t border-slate-900'>
          <p>start-words MVP 1 — Row Level Security Verification Suite</p>
        </footer>
      </div>
    </main>
  );
}
