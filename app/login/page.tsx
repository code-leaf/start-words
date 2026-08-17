import Link from "next/link";
import { LoginForm } from "@/components/LoginForm";

/**
 * ログイン画面（/login）
 *
 * 目的:
 * - 画面の組み立て（ヘッダー・レイアウト）のみを担当し、
 *   ログイン処理そのものはLoginFormへ委譲する
 */
export default function LoginPage() {
  return (
    <main className="min-h-dvh bg-slate-100 flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-md flex flex-col items-center gap-6">
        <header className="text-center">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
            ログイン
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">
            メールアドレスとパスワードでログインします
          </p>
        </header>

        <LoginForm />

        <p className="text-sm text-slate-500">
          アカウントをお持ちでない方は{" "}
          <Link href="/signup" className="text-slate-800 font-semibold underline underline-offset-2">
            ユーザー登録
          </Link>
        </p>
      </div>
    </main>
  );
}
