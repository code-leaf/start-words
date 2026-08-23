import { CardRegisterForm } from "@/components/CardRegisterForm";
import { HomeLink } from "@/components/HomeLink";

/**
 * 単語登録画面（/register）
 *
 * 目的:
 * - ログイン中ユーザーが学習カード（表・裏）を新規登録するための画面
 * - 画面の組み立て（ヘッダー・レイアウト）のみを担当し、
 *   入力UI・登録処理はCardRegisterFormへ委譲する
 *
 * 「ホームへ戻る」導線について（MVP12追加）:
 * - 共通Headerは追加せず、このページ自身のコンテンツ内（フォームの上）に
 *   通常のフロー内リンクとして配置している。fixed配置のAuthStatusBadge
 *   （右上）とは重ならない位置・サイズにしてあり、フォームの操作も妨げない。
 * - このページのデザインを基準に components/HomeLink.tsx へ切り出し、
 *   他ページ（マイページ等）と共通コンポーネントとして統一している。
 */
export default function RegisterPage() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center p-4 sm:p-8 pt-20 sm:pt-8">
      <div className="w-full max-w-md flex flex-col items-center gap-6">
        <HomeLink />

        {/* 画面ヘッダー */}
        <header className="text-center">
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            単語を登録
          </h1>
          <p className="text-sm text-slate-300 mt-1.5">
            新しい学習カードを追加します
          </p>
        </header>

        <CardRegisterForm />
      </div>
    </main>
  );
}
