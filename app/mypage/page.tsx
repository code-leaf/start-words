import { createClient as createServerClient } from "@/lib/supabase/server";
import { fetchUserScores } from "@/lib/scores";
import { HomeLink } from "@/components/HomeLink";
import { Score, StudyType } from "@/types/score";

// 学習方式ごとの画面表示ラベル（ResultScreenと共通の対応表）
const STUDY_TYPE_LABEL: Record<StudyType, string> = {
  word: "Word",
  errata: "Errata",
};

// スコアの学習日時（created_at）を日本語ロケールの表示形式へ変換する
function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// 正解率をcorrect_count/question_countからその場で算出する（DBの値は保存・参照しない）
function calcAccuracy(score: Score): number {
  return score.question_count > 0
    ? Math.round((score.correct_count / score.question_count) * 100)
    : 0;
}

/**
 * マイページ (/mypage) — ログイン中ユーザー自身の学習セッション履歴一覧 (MVP10)
 *
 * 目的:
 * - Word/Errataの学習セッション完了時にscoresへ保存された履歴を、日時が新しい順に一覧表示する
 *
 * データ取得・認可について:
 * - Server Componentとしてサーバー側のSupabaseクライアント（Cookie経由の認証セッション）で
 *   fetchUserScoresを呼び出す。`.eq('user_id', ...)` のような絞り込みはクライアント側では行わず、
 *   scoresテーブルのRLS（auth.uid() = user_id）によってログイン中ユーザー自身の行のみが返る。
 * - 未ログイン状態での直接アクセスは、他の保護ページと同様にミドルウェア（lib/supabase/middleware.ts）
 *   側で /login へリダイレクトされる。
 * - 正解率は保存された値を表示するのではなく、取得したcorrect_count/question_countから都度算出する。
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

        {!error && scores.length === 0 && (
          <div className="w-full text-center py-16 px-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-lg font-medium text-slate-700">
              まだ学習履歴がありません
            </p>
            <p className="text-sm text-slate-400 mt-2">
              Word / Errataで学習を最後まで終えると、ここに履歴が表示されます。
            </p>
          </div>
        )}

        {!error && scores.length > 0 && (
          <ul className="space-y-3">
            {scores.map((score) => (
              <li
                key={score.id}
                className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4"
              >
                <div>
                  <p className="text-xs text-slate-400">
                    {formatDateTime(score.created_at)}
                  </p>
                  <p className="text-sm font-semibold text-indigo-600 mt-1">
                    {STUDY_TYPE_LABEL[score.study_type]}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-slate-800 font-medium">
                    {score.correct_count} / {score.question_count}問
                  </p>
                  <p className="text-sm text-slate-500">
                    正解率 {calcAccuracy(score)}%
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
