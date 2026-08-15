import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Next.jsのMiddlewareでSupabaseの認証セッション（クッキー）を刷新・保持するための処理です。
 * 
 * 目的:
 * - ユーザーのアクセストークンが期限切れになりそうな場合、自動的にリフレッシュトークンを使用してクッキーを更新します。
 * - Server Componentとブラウザ間で認証クッキーが不整合を起こさないように同期を維持します。
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
  await supabase.auth.getUser();

  return supabaseResponse;
}
