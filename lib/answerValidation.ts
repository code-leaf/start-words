/**
 * 正解候補入力欄配列（answerTexts）の共通バリデーション
 *
 * 単語登録（useCardRegister）と単語編集（useCardEdit）の両方で
 * 同じ方針（trim・空欄禁止・同一カード内重複禁止）を適用するため、
 * 双方のフックから共有するロジックとして切り出している。
 */
export function validateAnswerTexts(rawTexts: string[]): {
  trimmed: string[];
  errors: (string | null)[];
} {
  const trimmed = rawTexts.map((text) => text.trim());
  const errors: (string | null)[] = trimmed.map((text) =>
    text === "" ? "正解候補を入力してください" : null
  );

  const seen = new Set<string>();
  trimmed.forEach((text, index) => {
    if (text === "" || errors[index]) return;
    if (seen.has(text)) {
      errors[index] = "同じ正解候補が既に入力されています";
    } else {
      seen.add(text);
    }
  });

  return { trimmed, errors };
}

/** バリデーションエラー配列のいずれかにエラーが存在するかどうかを判定する */
export function hasValidationError(errors: (string | null)[]): boolean {
  return errors.some((error) => error !== null);
}
