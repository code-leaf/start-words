import { SupabaseClient } from '@supabase/supabase-js';
import { Profile } from '@/types/profile';

/**
 * プロフィール (profiles) データの取得を担当するモジュールです (データアクセス層)
 *
 * lib/cards.ts と同様、UIコンポーネントから直接Supabaseクエリを書かず、
 * データ取得ロジックをここに集約します。
 *
 * INSERT関数を用意していない理由:
 * - profilesへの新規行作成は、ユーザー登録時にDBトリガー (handle_new_user) が
 *   自動的に行うため、アプリケーションコード側からINSERTを発行する必要がありません。
 */

/**
 * ログイン中ユーザー自身のプロフィールを取得します。
 *
 * `.eq('id', ...)` のような絞り込みを明示的に行わなくても、
 * RLSによりログイン中ユーザー自身の行のみが取得対象となります。
 */
export async function fetchCurrentProfile(
  supabase: SupabaseClient
): Promise<{ profile: Profile | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('プロフィール取得エラー:', error);
      return { profile: null, error: error.message };
    }

    return { profile: (data as Profile) ?? null, error: null };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : '不明なエラーが発生しました';
    return { profile: null, error: errorMessage };
  }
}
