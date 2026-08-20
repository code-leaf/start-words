import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * ログインしていないと利用できないページのパス一覧 (MVP7)
 *
 * ここに追加するだけで、Server Component・Client Componentの実装を問わず、
 * 直接URLアクセスも含めてミドルウェア層で一律にログイン必須化できる。
 */
const PROTECTED_PATH_PREFIXES = ['/word', '/errata', '/register', '/mypage'];

/**
 * 指定パスが保護対象パスかどうかを判定します。
 * `startsWith` だけで判定すると `/registerX` のような無関係なパスまで
 * 保護対象に含めてしまうため、完全一致または `/register/` のような
 * サブパスの場合のみ保護対象とみなします。
 */
function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/**
 * Next.jsのMiddlewareでSupabaseの認証セッション（クッキー）を刷新・保持するための処理です。
 *
 * 目的:
 * - ユーザーのアクセストークンが期限切れになりそうな場合、自動的にリフレッシュトークンを使用してクッキーを更新します。
 * - Server Componentとブラウザ間で認証クッキーが不整合を起こさないように同期を維持します。
 * - あわせて、未ログインユーザーによる保護ページ（/word, /errata, /register）への
 *   直接アクセスをここでブロックし、ログイン画面へ誘導します（MVP7）。
 *   画面側でUIを隠すだけでは直接URLアクセスを防げないため、リクエストの入口である
 *   ミドルウェアで判定する必要があります。
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';

  // 環境変数が設定されていない場合はそのままレスポンスを返します
  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // 重要: getUser() を呼ぶことでトークンの有効性を確認し、必要に応じてクッキーを再発行・更新します
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 未ログインユーザーが保護ページへ直接アクセスした場合、ログイン画面へリダイレクトする
  if (!user && isProtectedPath(request.nextUrl.pathname)) {
    const loginUrl = new URL('/login', request.url);

    const redirectResponse = NextResponse.redirect(loginUrl);
    // getUser()内でクッキーが更新されている場合に備え、リダイレクト先のレスポンスにも
    // 同じクッキーを引き継いでおく（supabaseResponseだけにセットして破棄すると更新が失われるため）
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });

    return redirectResponse;
  }

  return supabaseResponse;
}
