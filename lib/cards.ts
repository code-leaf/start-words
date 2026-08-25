import { SupabaseClient } from '@supabase/supabase-js';
import { Card } from '@/types/card';

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
 *
 * MVP14での変更点:
 * - 1カード1正解だった `back_text` を廃止し、正解候補は `card_answers` テーブル
 *   （1カード:N）で管理する。`fetchUserCards` は `card_answers` を結合して取得し、
 *   カード登録は「cardsへのINSERT」→「card_answersへの一括INSERT」の2段階で行う。
 */

export interface FetchCardsResult {
  cards: Card[];
  error: string | null;
}

/**
 * ログイン中ユーザーのカード一覧を、紐づく正解候補（card_answers）とあわせて取得します。
 *
 * @param supabase ClientまたはServerのSupabaseクライアント
 * @returns カード配列（各カードにanswers配列を含む）とエラー情報のオブジェクト
 */
export async function fetchUserCards(supabase: SupabaseClient): Promise<FetchCardsResult> {
  try {
    // RLSが有効なため、.select('*') だけでログインユーザー自身のカードのみが抽出されます
    // answers:card_answers(*) で正解候補を結合し、card.answersとして受け取る
    const { data, error } = await supabase
      .from('cards')
      .select('*, answers:card_answers(*)')
      .order('created_at', { ascending: false })
      .order('created_at', { ascending: true, referencedTable: 'card_answers' });

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
 * 重複判定はfront_textのみを対象とします（MVP14以降も表側の重複判定仕様は変更しない）。
 * また、`.eq('user_id', ...)` のような絞り込みを明示的に行わなくても、
 * RLSによりログイン中ユーザー自身のカードのみが検索対象となるため、
 * 他ユーザーの同一front_textとは重複しません。
 *
 * 大文字・小文字の扱い:
 * - 重複判定では大文字・小文字を区別しません（apple / Apple / APPLE は同一とみなす）。
 * - `.ilike()` によりPostgreSQL側で大文字小文字を無視した完全一致検索を行うため、
 *   JavaScript側で全件取得してから比較する必要がなく、RLSも通常どおり適用されます。
 * - DBへ保存する値（front_text本体）は今回の判定と無関係で、入力値をそのまま保存します。
 *
 * @param excludeCardId 単語編集時、比較対象から自分自身のカードを除外するために指定する（MVP14）。
 *   新規登録時は指定不要（undefinedのまま呼び出す）。
 */
export async function checkDuplicateFrontText(
  supabase: SupabaseClient,
  frontText: string,
  excludeCardId?: string
): Promise<{ isDuplicate: boolean; error: string | null }> {
  try {
    let query = supabase
      .from('cards')
      .select('id')
      .ilike('front_text', escapeIlikeWildcards(frontText));

    if (excludeCardId) {
      query = query.neq('id', excludeCardId);
    }

    const { data, error } = await query.limit(1);

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
 * IDを指定して、ログイン中ユーザー自身のカードを正解候補（card_answers）とあわせて1件取得します。
 *
 * RLSにより、他人のカードのidを指定した場合はデータが返らず（cardがnullになり）、
 * 存在しないid・自分のカードではないidのいずれも同じ結果として扱われます。
 * 呼び出し側（編集画面）はcardがnullの場合、not-found相当として扱ってください。
 */
export async function fetchCardById(
  supabase: SupabaseClient,
  id: string
): Promise<{ card: Card | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('cards')
      .select('*, answers:card_answers(*)')
      .eq('id', id)
      .order('created_at', { ascending: true, referencedTable: 'card_answers' })
      .maybeSingle();

    if (error) {
      console.error('カード取得エラー:', error);
      return { card: null, error: error.message };
    }

    return { card: (data as Card) ?? null, error: null };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : '不明なエラー';
    return { card: null, error: errorMessage };
  }
}

export interface InsertCardWithAnswersParams {
  user_id: string;
  front_text: string;
  /** 正解候補のテキスト一覧（呼び出し側でtrim・重複排除・空欄チェック済みであること） */
  answer_texts: string[];
}

/**
 * 新規カードを、正解候補（card_answers）とあわせて登録します。
 *
 * cards -> card_answers の順にINSERTする2段階の処理です。
 * card_answersのINSERTに失敗した場合、正解候補を持たないカードだけが
 * 残ってしまう不整合を避けるため、直前に作成したcardを削除してロールバックします。
 * RLSにより、user_idがauth.uid()と一致しないcardのinsertはDB側で拒否されます。
 */
export async function insertCardWithAnswers(
  supabase: SupabaseClient,
  params: InsertCardWithAnswersParams
): Promise<{ card: Card | null; error: string | null }> {
  try {
    const { data: cardData, error: cardError } = await supabase
      .from('cards')
      .insert([{ user_id: params.user_id, front_text: params.front_text }])
      .select()
      .single();

    if (cardError || !cardData) {
      console.error('カード登録エラー:', cardError);
      return { card: null, error: cardError?.message ?? 'カードの登録に失敗しました' };
    }

    const answerRows = params.answer_texts.map((answer_text) => ({
      card_id: cardData.id,
      answer_text,
    }));

    const { data: answersData, error: answersError } = await supabase
      .from('card_answers')
      .insert(answerRows)
      .select();

    if (answersError) {
      console.error('正解候補登録エラー:', answersError);
      // card_answersが1件も無いカードを残さないよう、直前に作成したcardを削除する
      await supabase.from('cards').delete().eq('id', cardData.id);
      return { card: null, error: answersError.message };
    }

    return {
      card: { ...cardData, answers: answersData ?? [] } as Card,
      error: null,
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : '不明なエラー';
    return { card: null, error: errorMessage };
  }
}

/**
 * カードの表テキストを更新します。
 * RLSにより、他人の user_id を持つカードに対する更新は拒否されます。
 *
 * MVP14での変更点: 正解候補（back_text相当）はcard_answersで管理するため、
 * このcards.updateはfront_textのみを対象とする。
 */
export async function updateCard(
  supabase: SupabaseClient,
  id: string,
  updates: { front_text?: string }
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

export interface UpdateCardWithAnswersParams {
  id: string;
  front_text: string;
  /** 更新後の正解候補テキスト一覧（呼び出し側でtrim・重複排除・空欄チェック済みであること） */
  answer_texts: string[];
}

/**
 * 既存カードの表テキストと正解候補（card_answers）をまとめて更新します（単語編集画面用、MVP14）。
 *
 * Supabase（PostgREST経由）にはアプリケーションから利用できるトランザクションが無いため、
 * 以下の順序で処理し、「正解候補が一時的に0件になる」状態が発生しないようにしています。
 *   1. 現在のcard_answersを取得し、新しいanswer_textsとの差分（追加分・削除分）を計算する
 *   2. 追加分を先にINSERTする（この時点でまだ古い候補も残っているため、0件にはならない）
 *   3. 不要になった候補をIDで指定してDELETEする
 *   4. 最後にcards.front_textを更新する
 * 途中で失敗した場合、それ以降の手順は実行されないため、悪くても
 * 「意図した候補より多く残る」「front_textだけ未更新」程度の不整合に留まり、
 * 候補が失われる・0件になることはありません。失敗時はエラーを返すため、
 * 呼び出し側（useCardEdit）は再度保存を促すことができます。
 */
export async function updateCardWithAnswers(
  supabase: SupabaseClient,
  params: UpdateCardWithAnswersParams
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { data: currentAnswers, error: fetchError } = await supabase
      .from('card_answers')
      .select('id, answer_text')
      .eq('card_id', params.id);

    if (fetchError) {
      console.error('正解候補取得エラー:', fetchError);
      return { success: false, error: fetchError.message };
    }

    const currentTexts = new Set((currentAnswers ?? []).map((a) => a.answer_text));
    const nextTexts = new Set(params.answer_texts);

    const textsToInsert = params.answer_texts.filter((text) => !currentTexts.has(text));
    const idsToDelete = (currentAnswers ?? [])
      .filter((a) => !nextTexts.has(a.answer_text))
      .map((a) => a.id);

    if (textsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('card_answers')
        .insert(textsToInsert.map((answer_text) => ({ card_id: params.id, answer_text })));

      if (insertError) {
        console.error('正解候補追加エラー:', insertError);
        return { success: false, error: insertError.message };
      }
    }

    if (idsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('card_answers')
        .delete()
        .in('id', idsToDelete);

      if (deleteError) {
        console.error('正解候補削除エラー:', deleteError);
        return { success: false, error: deleteError.message };
      }
    }

    const { success: cardUpdateSuccess, error: cardUpdateError } = await updateCard(supabase, params.id, {
      front_text: params.front_text,
    });

    if (!cardUpdateSuccess) {
      return { success: false, error: cardUpdateError };
    }

    return { success: true, error: null };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : '不明なエラー';
    return { success: false, error: errorMessage };
  }
}

/**
 * カードを削除します。card_answersはON DELETE CASCADEにより自動的に削除されます。
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
