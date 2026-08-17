import { SupabaseClient } from '@supabase/supabase-js';
import { Card, InsertCard } from '@/types/card';

/**
 * カードデータの操作・取得を担当するモジュールです (データアクセス層)
 * 
 * 役割:
 * - UIコンポーネントから直接Supabaseクエリを書くのではなく、データ操作ロジックをカプセル化します。
 * - UI側は「データの取得方法」を知る必要がなく、「取得結果」のみに集中できます。
 * 
 * セキュリティに関する重要なポイント (RLS):
 * - `fetchUserCards` では、アプリケーション側で `.eq('user_id', currentUserId)` のような条件を付与していません。
 * - なぜなら、PostgreSQL側で設定された RLS (Row Level Security) により、
 *   `auth.uid() = cards.user_id` の条件を満たす行（＝ログイン中ユーザー自身のカード）のみが
 *   データベースレベルで自動的にフィルタリングされて返されるためです。
 */

export interface FetchCardsResult {
  cards: Card[];
  error: string | null;
}

/**
 * ログイン中ユーザーのカード一覧を取得します。
 * 
 * @param supabase ClientまたはServerのSupabaseクライアント
 * @returns カード配列とエラー情報のオブジェクト
 */
export async function fetchUserCards(supabase: SupabaseClient): Promise<FetchCardsResult> {
  try {
    // RLSが有効なため、.select('*') だけでログインユーザー自身のカードのみが抽出されます
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('カード取得エラー:', error);
      return {
        cards: [],
        error: `カードの取得に失敗しました: ${error.message}`,
      };
    }

    return {
      cards: (data as Card[]) || [],
      error: null,
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : '不明なエラーが発生しました';
    console.error('予期せぬエラーが発生しました:', err);
    return {
      cards: [],
      error: `カード取得中に例外が発生しました: ${errorMessage}`,
    };
  }
}

/**
 * 新規カードを登録します。
 * RLSにより、insertされる行の user_id が auth.uid() と一致しない場合はエラーになります。
 */
export async function insertCard(
  supabase: SupabaseClient,
  card: InsertCard
): Promise<{ card: Card | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('cards')
      .insert([card])
      .select()
      .single();

    if (error) {
      console.error('カード登録エラー:', error);
      return { card: null, error: error.message };
    }

    return { card: data as Card, error: null };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : '不明なエラー';
    return { card: null, error: errorMessage };
  }
}

/**
 * PostgreSQLのILIKE演算子においてワイルドカードとして解釈される
 * `%`・`_`・`\` をエスケープします。
 *
 * なぜ必要か:
 * - 重複判定にはILIKE（大文字小文字を無視した比較）を使用しますが、
 *   ILIKEはパターンマッチ演算子のため、front_textに`%`や`_`が含まれると
 *   ユーザーの意図しない部分一致（例: "a_ple"が"apple"にもマッチする等）が
 *   発生してしまいます。事前にエスケープすることで、常に「完全一致」の
 *   大文字小文字無視比較として機能させます。
 */
function escapeIlikeWildcards(text: string): string {
  // バックスラッシュ自体のエスケープを最初に行い、後続の置換で二重エスケープしないようにする
  return text.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

/**
 * ログイン中ユーザー自身の登録済みカードの中に、指定した表テキストと同じものが存在するか確認します。
 *
 * 重複判定はfront_textのみを対象とし、back_textは条件に含めません。
 * また、`.eq('user_id', ...)` のような絞り込みを明示的に行わなくても、
 * RLSによりログイン中ユーザー自身のカードのみが検索対象となるため、
 * 他ユーザーの同一front_textとは重複しません。
 *
 * 大文字・小文字の扱い:
 * - 重複判定では大文字・小文字を区別しません（apple / Apple / APPLE は同一とみなす）。
 * - `.ilike()` によりPostgreSQL側で大文字小文字を無視した完全一致検索を行うため、
 *   JavaScript側で全件取得してから比較する必要がなく、RLSも通常どおり適用されます。
 * - DBへ保存する値（front_text本体）は今回の判定と無関係で、入力値をそのまま保存します。
 */
export async function checkDuplicateFrontText(
  supabase: SupabaseClient,
  frontText: string
): Promise<{ isDuplicate: boolean; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('cards')
      .select('id')
      .ilike('front_text', escapeIlikeWildcards(frontText))
      .limit(1);

    if (error) {
      console.error('重複確認エラー:', error);
      return { isDuplicate: false, error: error.message };
    }

    return { isDuplicate: (data?.length ?? 0) > 0, error: null };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : '不明なエラー';
    return { isDuplicate: false, error: errorMessage };
  }
}

/**
 * カードを更新します。
 * RLSにより、他人の user_id を持つカードに対する更新は拒否されます。
 */
export async function updateCard(
  supabase: SupabaseClient,
  id: string,
  updates: { front_text?: string; back_text?: string }
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('cards')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select();

    if (error) {
      return { success: false, error: error.message };
    }

    // RLSにより自分のカード以外は更新されないため、更新された件数が0件の場合は権限なし/対象なしとなります
    if (!data || data.length === 0) {
      return { success: false, error: 'RLSにより拒否されたか、カードが存在しません' };
    }

    return { success: true, error: null };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : '不明なエラー';
    return { success: false, error: errorMessage };
  }
}

/**
 * カードを削除します。
 * RLSにより、他人の user_id を持つカードの削除は拒否されます。
 */
export async function deleteCard(
  supabase: SupabaseClient,
  id: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('cards')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      return { success: false, error: error.message };
    }

    // RLSにより自分のカード以外は削除されないため、削除された件数が0件の場合は権限なし/対象なしとなります
    if (!data || data.length === 0) {
      return { success: false, error: 'RLSにより拒否されたか、カードが存在しません' };
    }

    return { success: true, error: null };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : '不明なエラー';
    return { success: false, error: errorMessage };
  }
}
