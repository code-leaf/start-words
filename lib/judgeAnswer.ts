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
 * 入力値と正解が一致するかどうかを判定する
 *
 * 判定方式:
 * - MVP4では前後空白除去のみを行う単純な完全一致比較とする（大文字小文字は区別する）
 */
export function isAnswerCorrect(input: string, correctAnswer: string): boolean {
  return normalizeAnswer(input) === normalizeAnswer(correctAnswer);
}
