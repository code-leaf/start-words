import { SupabaseConfigWarning } from '@/components/SupabaseConfigWarning';
import { OpeningLauncher } from '@/components/opening/OpeningLauncher';

/**
 * 公開用トップページ（Server Component）
 *
 * MVP12での変更点:
 * - MVP1〜MVP11の開発・検証用UI（RLS検証パネル・認証セッション手動操作パネル・
 *   カード一覧のデバッグ表示など）はユーザー向け画面から撤去し、実際に利用する
 *   ユーザーのための導線（単語帳・穴埋め・単語登録・マイページ・オープニング演出）
 *   のみを残した公開用ページとして構成している。
 * - 認証状態の表示・ログイン導線は共通の AuthStatusBadge（app/layout.tsx）に
 *   一本化されているため、このページでは扱わない。
 */
export default function Home() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const isConfigured = Boolean(supabaseUrl && supabaseKey);

  return (
    <main className='min-h-dvh text-slate-100 flex flex-col items-center justify-center p-4 sm:p-8'>
      <div className='max-w-lg w-full space-y-8 pt-16 sm:pt-4'>
        {/* ヘッダーエリア（共通Headerは設けず、ページ自身のタイトルとして配置） */}
        <header className='text-center space-y-3'>
          <h1 className='text-4xl sm:text-5xl font-extrabold tracking-tight bg-linear-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent'>
            START-WORDS
          </h1>
          {/*
            スマートフォン幅での折り返しについて:
            「フラッシュカードで、はじめの一歩を踏み出そう。」は、狭い画面では
            自然な折り返し位置（読点の後）を超えてもう1行にはみ出し、
            「そう。」のような短い孤立行ができてしまう。sm未満でのみ読点の後に
            改行を追加し、意味の区切り（読点）で改行が起きるようにすることで、
            孤立行を避けている（sm以上は横幅に余裕があるため追加改行なし）。
          */}
          <p className='text-sm sm:text-base text-slate-300 max-w-sm mx-auto leading-relaxed'>
            単語力は英語学習の出発点。
            <br />
            フラッシュカードで、
            <br className='sm:hidden' />
            はじめの一歩を踏み出そう。
          </p>
        </header>

        {/* ホームメニュー（単語帳・穴埋め・単語登録・マイページ・オープニング演出を観る）とオープニング演出 */}
        <OpeningLauncher />

        {isConfigured ? null : <SupabaseConfigWarning />}
      </div>
    </main>
  );
}
