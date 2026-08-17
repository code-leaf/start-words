"use client";

import React, { useEffect } from "react";
import { useCardSession } from "@/hooks/useCardSession";
import { useStudyCards } from "@/hooks/useStudyCards";
import { useModal } from "@/contexts/ModalContext";
import { StudyScreen } from "@/components/StudyScreen";
import "@/styles/card-ui/bb8-toggle.css";
import "@/styles/card-ui/flash-card.css";

/**
 * 単語学習画面コンポーネント (/word)
 *
 * 目的:
 * - Supabaseから取得したカードを使って、シャッフル単語学習フロー（めくり → 汎用自己採点モーダル → 次へ進行）を提供
 * - 共通セッションフック(useCardSession)により、進捗管理・正誤記録・次カード進行・リトライ制御を一元管理
 *
 * レイアウト・データ取得はStudyScreen/useStudyCardsへ委譲し、
 * このファイルには「word固有の自己採点モーダルを開く判定ロジック」のみを残す設計とした
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
  } = useCardSession(cards);

  // カード裏面（解答）表示かつ未回答の場合、自動で自己採点モーダルを開く
  useEffect(() => {
    if (isFlipped && !hasAnsweredCurrent) {
      openModal("score", undefined, (actionKey) => {
        // 'correct' アクション時は正解(true)、それ以外('incorrect'等)は不正解(false)として記録
        recordAnswer(actionKey === "correct");
      });
    }
  }, [isFlipped, hasAnsweredCurrent, openModal, recordAnswer]);

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
      onRetry={goToNextCard}
      toggleHint="BB-8トグルで裏面（解答）を確認してください"
    />
  );
}
