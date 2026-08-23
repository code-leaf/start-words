import { createClient as createServerClient } from "@/lib/supabase/server";
import { fetchUserScores } from "@/lib/scores";
import { HomeLink } from "@/components/HomeLink";
import { ScoreHistory } from "@/components/ScoreHistory";

/**
 * マイページ (/mypage) — ログイン中ユーザー自身の学習セッション履歴一覧 (MVP10)
 *
 * 目的:
 * - Word/Errataの学習セッション完了時にscoresへ保存された履歴を一覧表示する
 * - MVP13で、ユーザーが選択した基準で履歴を並び替えられるソートUIを追加した
 *   （並び替え自体は Client Component の ScoreHistory 側で行う）
 *
 * データ取得・認可について:
 * - Server Componentとしてサーバー側のSupabaseクライアント（Cookie経由の認証セッション）で
 *   fetchUserScoresを呼び出す。`.eq('user_id', ...)` のような絞り込みはクライアント側では行わず、
 *   scoresテーブルのRLS（auth.uid() = user_id）によってログイン中ユーザー自身の行のみが返る。
 * - 未ログイン状態での直接アクセスは、他の保護ページと同様にミドルウェア（lib/supabase/middleware.ts）
 *   側で /login へリダイレクトされる。
 */
export default async function MyPage() {
  const supabase = await createServerClient();
  const { scores, error } = await fetchUserScores(supabase);

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-8 sm:py-12 pt-20 sm:pt-12">
      <div className="w-full max-w-2xl space-y-6">
        {/*
          右上にはAuthStatusBadge（fixed配置のログアウトボタン等）が常時重なって表示されるため、
          ページ全体をpt-20で下げてバッジの高さ分の余白を確保している。
          「ホームへ戻る」導線は単語登録画面(/register)と同じHomeLinkコンポーネントを使用し、
          全ページで同一のデザインに統一している。
        */}
        <HomeLink />

        <header>
          <h1 className="text-xl font-bold text-white">マイページ</h1>
        </header>

        {error && (
          <div className="w-full p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center mb-4">
            <p className="font-semibold">エラーが発生しました</p>
            <p className="mt-1">{error}</p>
          </div>
        )}

        {!error && <ScoreHistory scores={scores} />}
      </div>
    </main>
  );
}
