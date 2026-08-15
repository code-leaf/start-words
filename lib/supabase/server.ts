import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/card';

/**
 * サーバー環境 (Server Components, Server Actions, Route Handlers) で使用する Supabase クライアントを作成します。
 * 
 * 【なぜサーバー用クライアントが必要なのか？】
 * Next.jsのサーバーコンポーネントでデータを取得する際、クライアントから送信されたHTTP Cookieに含まれる
 * 認証セッション情報（アクセストークン等）を取り出し、Supabaseリクエストのヘッダーに設定する必要があります。
 * 
 * 【RLS (Row Level Security) との連動】
 * サーバー側で取得した認証CookieをSupabaseへ渡すことで、PostgreSQLエンジン側で `auth.uid()` が設定されます。
 * これにより、App側で `WHERE user_id = ...` のような検索条件を強制せずとも、
 * PostgreSQLのRLSポリシーによりログイン中ユーザー自身のデータのみが安全に抽出されます。
 */
export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';

  return createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Componentのレンダリング中にクッキーを設定しようとするとNext.jsがエラーを投げるため、
          // ここでの例外は捕捉して無視します。（実際のクッキー更新はMiddleware側で行われます）
        }
      },
    },
  });
}
