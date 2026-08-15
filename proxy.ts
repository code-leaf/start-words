import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * Next.js 16 Proxy (旧 middleware)
 * 
 * すべてのリクエストに対してSupabaseの認証セッション（クッキー）を更新・同期します。
 * 静的アセットなどは matcher で除外しています。
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
