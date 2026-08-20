"use client";

import { useCallback, useState } from "react";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { insertScore } from "@/lib/scores";
import { useModal } from "@/contexts/ModalContext";
import { StudyType } from "@/types/score";

/** 保存に成功した学習セッションの結果（結果画面の表示に使用） */
export type SessionResult = {
  studyType: StudyType;
  correctCount: number;
  total: number;
};

/**
 * 学習セッション完了時のスコア保存を管理するフック (MVP10)
 *
 * word/errata共通で使用し、以下を一元管理する:
 * - 最終問題回答後の scores INSERT（ログイン中ユーザーのIDを都度取得して使用）
 * - 保存中フラグ（連打防止・ボタン表示制御用）
 * - 保存成功時の結果（結果画面表示用）
 * - 保存失敗時の通知（既存の汎用モーダルで表示。保存できたことにして先へ進めることはしない）
 *
 * word/errataで別々のスコア計算・保存ロジックを作らないための共通化ポイント。
 */
export function useSessionCompletion(studyType: StudyType) {
  const { openModal } = useModal();
  const [result, setResult] = useState<SessionResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const completeSession = useCallback(
    async (correctCount: number, total: number) => {
      setIsSaving(true);
      try {
        const supabase = createBrowserClient();

        // scores.user_idに設定するため、ログイン中ユーザーIDを都度Supabase Authから取得する
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          openModal("saveScoreError");
          return;
        }

        const { error: insertError } = await insertScore(supabase, {
          user_id: user.id,
          study_type: studyType,
          question_count: total,
          correct_count: correctCount,
        });

        if (insertError) {
          openModal("saveScoreError");
          return;
        }

        // 保存成功後にのみ結果画面へ進む
        setResult({ studyType, correctCount, total });
      } finally {
        setIsSaving(false);
      }
    },
    [studyType, openModal]
  );

  // 「もう一度挑戦する」時に結果画面を閉じ、学習画面へ戻すための状態リセット
  const reset = useCallback(() => {
    setResult(null);
  }, []);

  return { result, isSaving, completeSession, reset };
}
