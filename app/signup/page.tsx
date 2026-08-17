import Link from "next/link";
import { SignUpForm } from "@/components/SignUpForm";

/**
 * ユーザー登録画面（/signup）
 *
 * 目的:
 * - 画面の組み立て（ヘッダー・レイアウト）のみを担当し、
 *   ユーザー登録処理そのものはSignUpFormへ委譲する
 */
export default function SignUpPage() {
  return (
    <main className="min-h-dvh bg-slate-100 flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-md flex flex-col items-center gap-6">
        <header className="text-center">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
            ユーザー登録
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">
            メールアドレス・パスワード・ユーザー名を入力してください
          </p>
        </header>

        <SignUpForm />

        <p className="text-sm text-slate-500">
          すでにアカウントをお持ちの方は{" "}
          <Link href="/login" className="text-slate-800 font-semibold underline underline-offset-2">
            ログイン
          </Link>
        </p>
      </div>
    </main>
  );
}
