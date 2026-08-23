import { SignUpForm } from "@/components/SignUpForm";
import { AuthToggle } from "@/components/AuthToggle";

/**
 * ユーザー登録画面（/signup）
 *
 * 目的:
 * - 画面の組み立て（ヘッダー・レイアウト）のみを担当し、
 *   ユーザー登録処理そのものはSignUpFormへ委譲する
 *
 * ログイン⇄ユーザー登録の切り替えUIについて（MVP12追加）:
 * - /login と同様、右上のAuthToggleで現在地と切り替え先の両方を表示する。
 */
export default function SignUpPage() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center p-4 sm:p-8 pt-20 sm:pt-8">
      <AuthToggle active="signup" />
      <div className="w-full max-w-md flex flex-col items-center gap-6">
        <header className="text-center">
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            ユーザー登録
          </h1>
          {/*
            スマートフォン幅での折り返しについて:
            「・」区切りの3項目（メールアドレス／パスワード／ユーザー名）のうち、
            最後の区切り「・」の直後（＝単語の途中ではない安全な位置）で
            sm未満のみ改行し、2行にバランスよく分かれるようにしている
            （sm以上は横幅に余裕があり1行に収まるため追加改行なし）。
          */}
          <p className="text-sm text-slate-300 mt-1.5 leading-relaxed">
            メールアドレス・パスワード・
            <br className="sm:hidden" />
            ユーザー名を入力してください
          </p>
        </header>

        <SignUpForm />
      </div>
    </main>
  );
}
