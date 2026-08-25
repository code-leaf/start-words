import Link from "next/link";
import { Card } from "@/types/card";

/**
 * マイページの「登録した単語」一覧 (MVP14)
 *
 * 目的:
 * - 単語登録画面(/register)で登録したカード（表・正解候補）を一覧表示し、
 *   各カードから単語編集画面(/mypage/cards/[id]/edit)への導線を提供する
 *
 * 設計方針:
 * - 単語編集機能追加のためだけに大規模な管理画面を新設せず、既存のマイページ
 *   （学習履歴 ScoreHistory と同じカード型リストUI）に一覧セクションとして統合する
 * - データはapp/mypage/page.tsx（Server Component）がfetchUserCardsで取得済みのものを
 *   propsとして受け取るだけで、このコンポーネント自体はSupabaseへアクセスしない
 *   （UI → lib/cards.ts → Supabase という既存の責務分離を維持）
 */
export function CardList({ cards }: { cards: Card[] }) {
  if (cards.length === 0) {
    return (
      <div className="w-full text-center py-16 px-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <p className="text-lg font-medium text-slate-700">
          まだ単語が登録されていません
        </p>
        <p className="text-sm text-slate-400 mt-2">
          単語登録画面からカードを登録すると、ここに一覧表示されます。
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {cards.map((card) => (
        <li
          key={card.id}
          className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between gap-4"
        >
          <div className="min-w-0">
            <p className="text-slate-800 font-semibold truncate">
              {card.front_text}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {card.answers.map((answer) => (
                <span
                  key={answer.id}
                  className="px-2.5 py-1 bg-slate-100 rounded-full text-xs text-slate-600"
                >
                  {answer.answer_text}
                </span>
              ))}
            </div>
          </div>
          <Link
            href={`/mypage/cards/${card.id}/edit`}
            className="shrink-0 px-3.5 py-2 rounded-lg text-sm font-semibold text-indigo-600 border border-indigo-200 hover:bg-indigo-50 transition-colors"
          >
            編集
          </Link>
        </li>
      ))}
    </ul>
  );
}
