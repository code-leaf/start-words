import { LoginForm } from "@/components/LoginForm";
import { AuthToggle } from "@/components/AuthToggle";

/**
 * ログイン画面（/login）
 *
 * 目的:
 * - 画面の組み立て（ヘッダー・レイアウト）のみを担当し、
 *   ログイン処理そのものはLoginFormへ委譲する
 *
 * ログイン⇄ユーザー登録の切り替えUIについて（MVP12追加）:
 * - 右上にAuthToggle（「ログイン」「ユーザー登録」を常に並べたセグメント型
 *   トグル）を表示し、現在地（選択状態のハイライト）と切り替え先の両方が
 *   一目で分かるようにしている。旧実装（AuthSwitchLink、切り替え先のみを
 *   1つのリンクで示す方式）から置き換えた。
 */
export default function LoginPage() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center p-4 sm:p-8 pt-20 sm:pt-8">
      <AuthToggle active="login" />
      <div className="w-full max-w-md flex flex-col items-center gap-6">
        <header className="text-center">
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            ログイン
          </h1>
          {/*
            スマートフォン幅での折り返しについて:
            コンテナ幅に対して文字列がやや長く、何もしないと「パスワード」の
            途中（パス／ワード）のような不自然な位置で改行されてしまう。
            「メールアドレスと」の直後（単語の区切り）にsm未満でのみ改行を
            入れることで、単語の途中では改行されないようにしている
            （sm以上は横幅に余裕があり1行に収まるため追加改行なし）。
          */}
          <p className="text-sm text-slate-300 mt-1.5 leading-relaxed">
            メールアドレスと
            <br className="sm:hidden" />
            パスワードでログインします
          </p>
        </header>

        <LoginForm />
      </div>
    </main>
  );
}
