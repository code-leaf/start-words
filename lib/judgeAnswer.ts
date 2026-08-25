/**
 * 回答文字列の前後空白を除去する正規化処理
 *
 * 目的:
 * - ユーザーの入力ミス（余分な空白）による誤判定を防ぐ
 */
export function normalizeAnswer(text: string): string {
  return text.trim();
}

/**
 * 入力値が正解候補のいずれか1件と一致するかどうかを判定する
 *
 * 判定方式:
 * - 前後空白除去のみを行う単純な完全一致比較（大文字小文字は区別する）
 * - MVP14により1カードにつき複数の正解候補を持てるようになったため、
 *   correctAnswersのいずれか1件と一致すれば正解とする
 * - 部分一致・大文字小文字の自動変換・全角半角変換等の表記ゆれ吸収は行わない
 */
export function isAnswerCorrect(input: string, correctAnswers: string[]): boolean {
  const normalizedInput = normalizeAnswer(input);
  return correctAnswers.some(
    (correctAnswer) => normalizedInput === normalizeAnswer(correctAnswer)
  );
}
