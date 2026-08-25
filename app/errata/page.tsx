"use client";

import React, { useEffect, useCallback } from "react";
import { useCardSession } from "@/hooks/useCardSession";
import { useStudyCards } from "@/hooks/useStudyCards";
import { useErrataAnswer } from "@/hooks/useErrataAnswer";
import { useSessionCompletion } from "@/hooks/useSessionCompletion";
import { useModal } from "@/contexts/ModalContext";
import { isAnswerCorrect } from "@/lib/judgeAnswer";
import { StudyScreen } from "@/components/StudyScreen";
import { AnswerInput } from "@/components/AnswerInput";
import { ResultScreen } from "@/components/ResultScreen";
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
 * MVP10での変更点:
 * - 最終問題に回答した後は自動で新しいセッションを開始せず、1回の学習を1セッションとして
 *   scoresへ保存し、結果画面（ResultScreen）を表示する（useSessionCompletionに保存処理を委譲。wordと共通）
 * - 結果画面の「もう一度挑戦する」を押した場合のみ、useCardSessionのhandleRetryで
 *   新しいセッション（カード再シャッフル・進捗リセット）を開始する
 *
 * レイアウト・データ取得はStudyScreen/useStudyCardsへ委譲し、
 * このファイルには「errata固有の判定ロジック」とセッション完了制御のみを残す設計とした
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
    handleRetry,
  } = useCardSession(cards);

  // errata固有の回答入力値管理（useCardSessionから分離し、入力値という単一の関心事のみを担う）
  const {
    inputValue,
    setInputValue,
    reset: resetAnswer,
  } = useErrataAnswer();

  const { result, isSaving, completeSession, reset } =
    useSessionCompletion("errata");

  // カードをめくった瞬間に自動で正誤判定し、結果通知モーダルを表示する
  // hasAnsweredCurrent ガードにより、同一カードへの二重採点・二重モーダルを防止
  useEffect(() => {
    if (isFlipped && !hasAnsweredCurrent) {
      // MVP14: currentCard.answers（複数の正解候補）のいずれか1件と一致すれば正解とする
      const answerTexts = currentCard?.answers.map((answer) => answer.answer_text) ?? [];
      const isCorrect = isAnswerCorrect(inputValue, answerTexts);
      recordAnswer(isCorrect);
      openModal(isCorrect ? "errataCorrect" : "errataIncorrect", answerTexts);
    }
  }, [isFlipped, hasAnsweredCurrent, currentCard, inputValue, openModal, recordAnswer]);

  // 次のカードへ進む前に入力値をリセットするラッパー
  // goToNextCard を直接渡すと入力値が残ったまま次の問題に移るため、必ずここでresetを先行させる
  const handleAdvance = useCallback(() => {
    resetAnswer();
    goToNextCard();
  }, [resetAnswer, goToNextCard]);

  // 最終問題であれば学習セッションを完了させてscoresへ保存する
  const handleSessionComplete = useCallback(() => {
    completeSession(correctCount, total);
  }, [completeSession, correctCount, total]);

  // 「もう一度挑戦する」: 結果画面を閉じ、入力値をクリアしたうえで新しいセッションを開始する
  const handleRestart = useCallback(() => {
    reset();
    resetAnswer();
    handleRetry();
  }, [reset, resetAnswer, handleRetry]);

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
      isNextDisabled={!hasAnsweredCurrent}
      onNext={handleAdvance}
      onRetry={handleSessionComplete}
      isProcessing={isSaving}
      lastCardLabel="結果を見る"
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
