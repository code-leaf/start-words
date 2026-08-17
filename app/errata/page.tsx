"use client";

import React, { useEffect, useCallback } from "react";
import { useCardSession } from "@/hooks/useCardSession";
import { useStudyCards } from "@/hooks/useStudyCards";
import { useErrataAnswer } from "@/hooks/useErrataAnswer";
import { useModal } from "@/contexts/ModalContext";
import { isAnswerCorrect } from "@/lib/judgeAnswer";
import { StudyScreen } from "@/components/StudyScreen";
import { AnswerInput } from "@/components/AnswerInput";
import "@/styles/card-ui/bb8-toggle.css";
import "@/styles/card-ui/flash-card.css";

/**
 * 回答入力型学習画面コンポーネント (/errata)
 *
 * word学習との差分:
 * - useErrataAnswerフックによる回答入力値の管理
 * - StudyScreenのinputSlotにAnswerInputを渡す
 * - カードをめくった際にisAnswerCorrectで自動判定し、結果通知モーダル（errataCorrect/errataIncorrect）を表示
 * - 次のカードへ進む前に必ず入力値をリセットする（handleAdvance）
 *
 * レイアウト・データ取得はStudyScreen/useStudyCardsへ委譲し、
 * このファイルには「errata固有の判定ロジック」のみを残す設計とした
 */
export default function ErrataStudyPage() {
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

  // errata固有の回答入力値管理（useCardSessionから分離し、入力値という単一の関心事のみを担う）
  const {
    inputValue,
    setInputValue,
    reset: resetAnswer,
  } = useErrataAnswer();

  // カードをめくった瞬間に自動で正誤判定し、結果通知モーダルを表示する
  // hasAnsweredCurrent ガードにより、同一カードへの二重採点・二重モーダルを防止
  useEffect(() => {
    if (isFlipped && !hasAnsweredCurrent) {
      const isCorrect = isAnswerCorrect(inputValue, currentCard?.back_text ?? "");
      recordAnswer(isCorrect);
      openModal(
        isCorrect ? "errataCorrect" : "errataIncorrect",
        currentCard?.back_text ?? ""
      );
    }
  }, [isFlipped, hasAnsweredCurrent, currentCard, inputValue, openModal, recordAnswer]);

  // 次のカードへ進む前に入力値をリセットするラッパー
  // goToNextCard を直接渡すと入力値が残ったまま次の問題に移るため、必ずここでresetを先行させる
  const handleAdvance = useCallback(() => {
    resetAnswer();
    goToNextCard();
  }, [resetAnswer, goToNextCard]);

  return (
    <StudyScreen
      title="単語学習 (errata)"
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
      onNext={handleAdvance}
      onRetry={handleAdvance}
      toggleHint="BB-8トグルで回答を確定し、採点してください"
      inputSlot={
        <AnswerInput
          value={inputValue}
          onChange={setInputValue}
          disabled={hasAnsweredCurrent || isOpen}
        />
      }
    />
  );
}
