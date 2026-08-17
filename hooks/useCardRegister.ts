"use client";

import { useCallback, useState } from "react";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { checkDuplicateFrontText, insertCard } from "@/lib/cards";
import { useModal } from "@/contexts/ModalContext";

/**
 * 単語登録画面（/register）のフォーム状態・登録処理を管理するフック
 *
 * 目的:
 * - 入力値管理、バリデーション、ログインユーザー取得、重複確認、INSERT呼び出しという
 *   一連の登録フローを1箇所に集約し、CardRegisterForm側はUIの組み立てに専念できるようにする
 * - useStudyCardsやuseCardSessionと同様、Supabaseクライアントはフック内（関数実行時）に生成し、
 *   レンダーのたびにクライアントが再生成される問題を避ける
 */
export function useCardRegister() {
  const { openModal } = useModal();

  // フォーム入力値（表・裏）
  const [frontText, setFrontText] = useState("");
  const [backText, setBackText] = useState("");

  // 項目ごとのインラインバリデーションエラー
  const [frontError, setFrontError] = useState<string | null>(null);
  const [backError, setBackError] = useState<string | null>(null);

  // DBエラー等、フォーム全体に関わる予期しないエラーメッセージ
  const [submitError, setSubmitError] = useState<string | null>(null);

  // 登録処理中フラグ（二重送信防止・ボタン非活性化に使用）
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 登録成功時のみ呼び出す、入力欄を空に戻す処理
  const resetForm = useCallback(() => {
    setFrontText("");
    setBackText("");
  }, []);

  const register = useCallback(async () => {
    // 再送信時に前回のエラー表示を一旦クリアする
    setSubmitError(null);

    // 前後の空白を除去した値で判定・登録する（空白のみの入力は未入力扱い）
    const trimmedFront = frontText.trim();
    const trimmedBack = backText.trim();

    const nextFrontError = trimmedFront === "" ? "表を入力してください" : null;
    const nextBackError = trimmedBack === "" ? "裏を入力してください" : null;
    setFrontError(nextFrontError);
    setBackError(nextBackError);

    // 未入力項目があれば、ここで処理を止めてインラインエラーのみ表示する
    if (nextFrontError || nextBackError) {
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

      const { error: insertError } = await insertCard(supabase, {
        user_id: user.id,
        front_text: trimmedFront,
        back_text: trimmedBack,
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
  }, [frontText, backText, openModal, resetForm]);

  return {
    frontText,
    setFrontText,
    backText,
    setBackText,
    frontError,
    backError,
    submitError,
    isSubmitting,
    register,
  };
}
