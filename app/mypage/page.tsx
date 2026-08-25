import { createClient as createServerClient } from "@/lib/supabase/server";
import { fetchUserScores } from "@/lib/scores";
import { fetchUserCards } from "@/lib/cards";
import { HomeLink } from "@/components/HomeLink";
import { ScoreHistory } from "@/components/ScoreHistory";
import { CardList } from "@/components/CardList";

/**
 * マイページ (/mypage) — ログイン中ユーザー自身の学習セッション履歴・登録単語一覧 (MVP10, MVP14)
 *
 * 目的:
 * - Word/Errataの学習セッション完了時にscoresへ保存された履歴を一覧表示する
 * - MVP13で、ユーザーが選択した基準で履歴を並び替えられるソートUIを追加した
 *   （並び替え自体は Client Component の ScoreHistory 側で行う）
 * - MVP14で、登録済みの単語（カード・正解候補）一覧と、そこからの編集導線を追加した
 *   （既存のマイページに統合し、単語編集専用の大きな管理画面は新設していない）
 *
 * データ取得・認可について:
 * - Server Componentとしてサーバー側のSupabaseクライアント（Cookie経由の認証セッション）で
 *   fetchUserScores / fetchUserCardsを呼び出す。`.eq('user_id', ...)` のような絞り込みは
 *   クライアント側では行わず、各テーブルのRLS（auth.uid()経由の判定）によって
 *   ログイン中ユーザー自身の行のみが返る。
 * - 未ログイン状態での直接アクセスは、他の保護ページと同様にミドルウェア（lib/supabase/middleware.ts）
 *   側で /login へリダイレクトされる。
 */
export default async function MyPage() {
  const supabase = await createServerClient();
  const { scores, error: scoresError } = await fetchUserScores(supabase);
  const { cards, error: cardsError } = await fetchUserCards(supabase);

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-8 sm:py-12 pt-20 sm:pt-12">
      <div className="w-full max-w-2xl space-y-10">
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

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">登録した単語</h2>
          {cardsError ? (
            <div className="w-full p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center">
              <p className="font-semibold">エラーが発生しました</p>
              <p className="mt-1">{cardsError}</p>
            </div>
          ) : (
            <CardList cards={cards} />
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">学習履歴</h2>
          {scoresError ? (
            <div className="w-full p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center">
              <p className="font-semibold">エラーが発生しました</p>
              <p className="mt-1">{scoresError}</p>
            </div>
          ) : (
            <ScoreHistory scores={scores} />
          )}
        </section>
      </div>
    </main>
  );
}
