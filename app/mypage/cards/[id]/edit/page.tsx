import { notFound } from "next/navigation";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { fetchCardById } from "@/lib/cards";
import { HomeLink } from "@/components/HomeLink";
import { CardEditForm } from "@/components/CardEditForm";

/**
 * 単語編集画面 (/mypage/cards/[id]/edit) (MVP14)
 *
 * 目的:
 * - マイページの「登録した単語」一覧から遷移し、既存カードの表・正解候補を編集する
 * - 画面の組み立て（ヘッダー・レイアウト）とカード取得のみを担当し、
 *   入力UI・更新処理はCardEditForm/useCardEditへ委譲する
 *
 * 認可について:
 * - /mypage 配下はミドルウェア（lib/supabase/middleware.ts）で未ログイン時に
 *   /loginへリダイレクトされるため、ここでは追加のログインチェックは行わない。
 * - fetchCardByIdはRLSにより自分のカードのみを取得できるため、他ユーザーのid・
 *   存在しないidを直接URL指定された場合はcardがnullとなり、notFound()で404を返す。
 */
export default async function CardEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { card, error } = await fetchCardById(supabase, id);

  if (!error && !card) {
    notFound();
  }

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center p-4 sm:p-8 pt-20 sm:pt-8">
      <div className="w-full max-w-md flex flex-col items-center gap-6">
        <HomeLink />

        {/* 画面ヘッダー */}
        <header className="text-center">
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            単語を編集
          </h1>
          <p className="text-sm text-slate-300 mt-1.5">
            表と正解候補を編集します
          </p>
        </header>

        {error && (
          <div className="w-full p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center">
            <p className="font-semibold">エラーが発生しました</p>
            <p className="mt-1">{error}</p>
          </div>
        )}

        {card && <CardEditForm card={card} />}
      </div>
    </main>
  );
}
