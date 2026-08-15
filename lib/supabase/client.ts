import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/card';

/**
 * クライアントコンポーネント (ブラウザ環境) で使用する Supabase クライアントを作成します。
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';

  return createBrowserClient<Database>(supabaseUrl, supabaseKey);
}
