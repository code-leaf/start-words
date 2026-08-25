"use client";

import { useCallback, useState } from "react";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { checkDuplicateFrontText, insertCardWithAnswers } from "@/lib/cards";
import { validateAnswerTexts, hasValidationError } from "@/lib/answerValidation";
import { useModal } from "@/contexts/ModalContext";

/**
 * 単語登録画面（/register）のフォーム状態・登録処理を管理するフック
 *
 * 目的:
 * - 入力値管理、バリデーション、ログインユーザー取得、重複確認、INSERT呼び出しという
 *   一連の登録フローを1箇所に集約し、CardRegisterForm側はUIの組み立てに専念できるようにする
 * - useStudyCardsやuseCardSessionと同様、Supabaseクライアントはフック内（関数実行時）に生成し、
 *   レンダーのたびにクライアントが再生成される問題を避ける
 *
 * MVP14での変更点:
 * - 「裏」の単一テキストを、複数の正解候補（answerTexts配列）へ変更した。
 *   各候補は個別に追加・削除でき、最低1件は必須とする。
 */
export function useCardRegister() {
  const { openModal } = useModal();

  // フォーム入力値（表）
  const [frontText, setFrontText] = useState("");
  // フォーム入力値（裏＝正解候補一覧。初期は1件の空欄）
  const [answerTexts, setAnswerTexts] = useState<string[]>([""]);

  // 項目ごとのインラインバリデーションエラー
  const [frontError, setFrontError] = useState<string | null>(null);
  // 正解候補ごとのインラインバリデーションエラー（answerTextsとインデックスで対応）
  const [answerErrors, setAnswerErrors] = useState<(string | null)[]>([null]);

  // DBエラー等、フォーム全体に関わる予期しないエラーメッセージ
  const [submitError, setSubmitError] = useState<string | null>(null);

  // 登録処理中フラグ（二重送信防止・ボタン非活性化に使用）
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 登録成功時のみ呼び出す、入力欄を初期状態に戻す処理
  const resetForm = useCallback(() => {
    setFrontText("");
    setAnswerTexts([""]);
    setAnswerErrors([null]);
  }, []);

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

  const register = useCallback(async () => {
    // 再送信時に前回のエラー表示を一旦クリアする
    setSubmitError(null);

    // 前後の空白を除去した値で判定・登録する（空白のみの入力は未入力扱い）
    const trimmedFront = frontText.trim();
    const nextFrontError = trimmedFront === "" ? "表を入力してください" : null;

    // 空欄チェック・同一カード内の重複チェックはuseCardEditと共通のロジックを使用する
    const { trimmed: trimmedAnswers, errors: nextAnswerErrors } =
      validateAnswerTexts(answerTexts);

    setFrontError(nextFrontError);
    setAnswerErrors(nextAnswerErrors);

    // 未入力・重複項目があれば、ここで処理を止めてインラインエラーのみ表示する
    if (nextFrontError || hasValidationError(nextAnswerErrors)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createBrowserClient();

      // cards.user_idに設定するため、ログイン中ユーザーIDをSupabase Authから取得する
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      // ユーザー情報が取得できない場合、user_idを確定できないため登録を中止する
      if (userError || !user) {
        setSubmitError(
          "ログイン情報を確認できなかったため、登録を中止しました。"
        );
        return;
      }

      // 重複判定はログイン中ユーザー自身のカードに限定し、front_textのみで比較する
      const { isDuplicate, error: duplicateError } =
        await checkDuplicateFrontText(supabase, trimmedFront);

      if (duplicateError) {
        setSubmitError("登録処理中にエラーが発生しました。");
        return;
      }

      if (isDuplicate) {
        // 重複時は入力値を保持したまま通知するだけなので、onActionは渡さずクリアしない
        openModal("registerDuplicate");
        return;
      }

      const { error: insertError } = await insertCardWithAnswers(supabase, {
        user_id: user.id,
        front_text: trimmedFront,
        answer_texts: trimmedAnswers,
      });

      if (insertError) {
        setSubmitError("登録処理中にエラーが発生しました。");
        return;
      }

      // 登録成功時は、モーダルを閉じた瞬間に入力欄をクリアし連続登録できるようにする
      openModal("registerSuccess", undefined, () => {
        resetForm();
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [frontText, answerTexts, openModal, resetForm]);

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
    register,
  };
}
