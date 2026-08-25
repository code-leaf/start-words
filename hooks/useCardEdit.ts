"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { checkDuplicateFrontText, updateCardWithAnswers } from "@/lib/cards";
import { validateAnswerTexts, hasValidationError } from "@/lib/answerValidation";
import { useModal } from "@/contexts/ModalContext";
import { Card } from "@/types/card";

/**
 * 単語編集画面（/mypage/cards/[id]/edit）のフォーム状態・更新処理を管理するフック (MVP14)
 *
 * useCardRegisterとの主な違い:
 * - 入力値の初期状態を、渡された既存カード（front_text・answers）から復元する
 * - 表テキストの重複判定時、編集中のカード自身を比較対象から除外する
 *   （除外しないと、front_textを変更しなかっただけで「自分自身と重複」と誤判定されてしまうため）
 * - 更新成功時は入力欄をクリアせず、モーダルを閉じた後に一覧（マイページ）へ戻る
 */
export function useCardEdit(card: Card) {
  const { openModal } = useModal();
  const router = useRouter();

  // フォーム入力値（表）。既存カードのfront_textで初期化する
  const [frontText, setFrontText] = useState(card.front_text);
  // フォーム入力値（裏＝正解候補一覧）。既存カードのanswersで初期化する（万一0件の場合は空欄1件から開始）
  const [answerTexts, setAnswerTexts] = useState<string[]>(
    card.answers.length > 0 ? card.answers.map((answer) => answer.answer_text) : [""]
  );

  const [frontError, setFrontError] = useState<string | null>(null);
  const [answerErrors, setAnswerErrors] = useState<(string | null)[]>(
    answerTexts.map(() => null)
  );

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 指定インデックスの正解候補テキストを更新する
  const updateAnswerText = useCallback((index: number, value: string) => {
    setAnswerTexts((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  // 正解候補入力欄を1件追加する（上限は設けない）
  const addAnswerField = useCallback(() => {
    setAnswerTexts((prev) => [...prev, ""]);
    setAnswerErrors((prev) => [...prev, null]);
  }, []);

  // 指定インデックスの正解候補入力欄を削除する（最後の1件は削除不可）
  const removeAnswerField = useCallback((index: number) => {
    setAnswerTexts((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
    setAnswerErrors((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }, []);

  const save = useCallback(async () => {
    setSubmitError(null);

    const trimmedFront = frontText.trim();
    const nextFrontError = trimmedFront === "" ? "表を入力してください" : null;

    const { trimmed: trimmedAnswers, errors: nextAnswerErrors } =
      validateAnswerTexts(answerTexts);

    setFrontError(nextFrontError);
    setAnswerErrors(nextAnswerErrors);

    if (nextFrontError || hasValidationError(nextAnswerErrors)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createBrowserClient();

      // 表テキストの重複判定は、編集中のカード自身(card.id)を比較対象から除外して行う
      const { isDuplicate, error: duplicateError } = await checkDuplicateFrontText(
        supabase,
        trimmedFront,
        card.id
      );

      if (duplicateError) {
        setSubmitError("更新処理中にエラーが発生しました。");
        return;
      }

      if (isDuplicate) {
        openModal("editDuplicate");
        return;
      }

      const { success, error: updateError } = await updateCardWithAnswers(supabase, {
        id: card.id,
        front_text: trimmedFront,
        answer_texts: trimmedAnswers,
      });

      if (!success) {
        console.error("カード更新エラー:", updateError);
        setSubmitError("更新処理中にエラーが発生しました。");
        return;
      }

      // 更新成功時は、モーダルを閉じた瞬間に一覧（マイページ）へ戻る
      openModal("editSuccess", undefined, () => {
        router.push("/mypage");
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [frontText, answerTexts, card.id, openModal, router]);

  return {
    frontText,
    setFrontText,
    answerTexts,
    updateAnswerText,
    addAnswerField,
    removeAnswerField,
    frontError,
    answerErrors,
    submitError,
    isSubmitting,
    save,
  };
}
