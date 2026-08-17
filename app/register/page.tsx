import { CardRegisterForm } from "@/components/CardRegisterForm";

/**
 * 単語登録画面（/register）
 *
 * 目的:
 * - ログイン中ユーザーが学習カード（表・裏）を新規登録するための画面
 * - 画面の組み立て（ヘッダー・レイアウト）のみを担当し、
 *   入力UI・登録処理はCardRegisterFormへ委譲する
 */
export default function RegisterPage() {
  return (
    <main className="min-h-dvh bg-slate-100 flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-md flex flex-col items-center gap-6">
        {/* 画面ヘッダー */}
        <header className="text-center">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
            単語を登録
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">
            新しい学習カードを追加します
          </p>
        </header>

        <CardRegisterForm />
      </div>
    </main>
  );
}
