import { SupabaseClient } from '@supabase/supabase-js';
import { Score, InsertScore } from '@/types/score';

/**
 * スコア（学習セッション結果）データの操作・取得を担当するモジュールです (データアクセス層)
 *
 * lib/cards.ts / lib/profiles.ts と同様、UIコンポーネントから直接Supabaseクエリを書かず、
 * データ操作ロジックをここに集約します。
 *
 * セキュリティに関する重要なポイント (RLS):
 * - `fetchUserScores` では `.eq('user_id', currentUserId)` のような条件を付与していません。
 *   RLS (auth.uid() = scores.user_id) により、ログイン中ユーザー自身のスコアのみが
 *   データベースレベルで自動的にフィルタリングされて返されるためです。
 * - `insertScore` も同様に、RLSのINSERTポリシーにより呼び出し側が渡した user_id が
 *   auth.uid() と一致しない場合はデータベース側で拒否されます。
 */

/**
 * 学習セッション完了時のスコアを1件登録します。
 * RLSにより、insertされる行の user_id が auth.uid() と一致しない場合はエラーになります。
 */
export async function insertScore(
  supabase: SupabaseClient,
  score: InsertScore
): Promise<{ score: Score | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('scores')
      .insert([score])
      .select()
      .single();

    if (error) {
      console.error('スコア登録エラー:', error);
      return { score: null, error: error.message };
    }

    return { score: data as Score, error: null };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : '不明なエラー';
    console.error('予期せぬエラーが発生しました:', err);
    return { score: null, error: errorMessage };
  }
}

/**
 * ログイン中ユーザー自身の学習セッション履歴を新しい順に取得します（マイページ用）。
 */
export async function fetchUserScores(
  supabase: SupabaseClient
): Promise<{ scores: Score[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('スコア取得エラー:', error);
      return {
        scores: [],
        error: `学習履歴の取得に失敗しました: ${error.message}`,
      };
    }

    return {
      scores: (data as Score[]) || [],
      error: null,
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : '不明なエラーが発生しました';
    console.error('予期せぬエラーが発生しました:', err);
    return {
      scores: [],
      error: `学習履歴取得中に例外が発生しました: ${errorMessage}`,
    };
  }
}
