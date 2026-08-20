"use client";

import React, { useCallback, useEffect } from "react";
import { useCardSession } from "@/hooks/useCardSession";
import { useStudyCards } from "@/hooks/useStudyCards";
import { useSessionCompletion } from "@/hooks/useSessionCompletion";
import { useModal } from "@/contexts/ModalContext";
import { StudyScreen } from "@/components/StudyScreen";
import { ResultScreen } from "@/components/ResultScreen";
import "@/styles/card-ui/bb8-toggle.css";
import "@/styles/card-ui/flash-card.css";

/**
 * 単語学習画面コンポーネント (/word)
 *
 * 目的:
 * - Supabaseから取得したカードを使って、シャッフル単語学習フロー（めくり → 汎用自己採点モーダル → 次へ進行）を提供
 * - 共通セッションフック(useCardSession)により、進捗管理・正誤記録・次カード進行・リトライ制御を一元管理
 *
 * MVP10での変更点:
 * - 最終問題に回答した後は自動で新しいセッションを開始せず、1回の学習を1セッションとして
 *   scoresへ保存し、結果画面（ResultScreen）を表示する（useSessionCompletionに保存処理を委譲）
 * - 結果画面の「もう一度挑戦する」を押した場合のみ、useCardSessionのhandleRetryで
 *   新しいセッション（カード再シャッフル・進捗リセット）を開始する
 *
 * レイアウト・データ取得はStudyScreen/useStudyCardsへ委譲し、
 * このファイルには「word固有の自己採点モーダルを開く判定ロジック」とセッション完了制御のみを残す設計とした
 */
export default function WordStudyPage() {
  const { cards, isLoading, error } = useStudyCards();
  const { openModal, isOpen } = useModal();

  const {
    currentCard,
    currentIndex,
    total,
    isFlipped,
    flip,
    correctCount,
    isLastCard,
    hasAnsweredCurrent,
    recordAnswer,
    goToNextCard,
    handleRetry,
  } = useCardSession(cards);

  const { result, isSaving, completeSession, reset } =
    useSessionCompletion("word");

  // カード裏面（解答）表示かつ未回答の場合、自動で自己採点モーダルを開く
  useEffect(() => {
    if (isFlipped && !hasAnsweredCurrent) {
      openModal("score", undefined, (actionKey) => {
        // 'correct' アクション時は正解(true)、それ以外('incorrect'等)は不正解(false)として記録
        recordAnswer(actionKey === "correct");
      });
    }
  }, [isFlipped, hasAnsweredCurrent, openModal, recordAnswer]);

  // 最終問題でなければ次のカードへ進み、最終問題であれば学習セッションを完了させてscoresへ保存する
  const handleSessionComplete = useCallback(() => {
    completeSession(correctCount, total);
  }, [completeSession, correctCount, total]);

  // 「もう一度挑戦する」: 結果画面を閉じ、useCardSessionのリトライ処理で新しいセッションを開始する
  const handleRestart = useCallback(() => {
    reset();
    handleRetry();
  }, [reset, handleRetry]);

  // 保存成功後は結果画面を表示する
  if (result) {
    return (
      <ResultScreen
        studyType={result.studyType}
        correctCount={result.correctCount}
        total={result.total}
        onRetry={handleRestart}
      />
    );
  }

  return (
    <StudyScreen
      title="単語学習 (word)"
      isLoading={isLoading}
      error={error}
      total={total}
      currentIndex={currentIndex}
      correctCount={correctCount}
      currentCard={currentCard}
      isFlipped={isFlipped}
      flip={flip}
      isModalOpen={isOpen}
      isLastCard={isLastCard}
      hasAnsweredCurrent={hasAnsweredCurrent}
      onNext={goToNextCard}
      onRetry={handleSessionComplete}
      isProcessing={isSaving}
      lastCardLabel="結果を見る"
      toggleHint="BB-8トグルで裏面（解答）を確認してください"
    />
  );
}
