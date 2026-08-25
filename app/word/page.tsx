"use client";

import React, { useCallback } from "react";
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
 * MVP14での変更点（学習UI/UX修正）:
 * - 以前は裏面をめくった瞬間に自動で自己採点モーダルが開いていたが、これだとフラッシュカード本来の
 *   「裏面を見て、自分の回答と答え合わせしてから自己採点する」という間が取れなかった。
 * - 「次のカード」ボタン押下をトリガーに自己採点モーダルを開くよう変更し、
 *   ユーザーが裏面を見てから自分のペースでボタンを押して採点できるようにした。
 * - モーダルで正解/不正解を選択した後は、そのままシームレスに次のカードへ進む（最終問題なら結果を保存する）。
 *   選択直後のcorrectCount stateはまだ再レンダー前で古い値のままのため、最終問題の保存では
 *   「選択結果を加算した値」をその場で計算して渡す（state更新を待つと保存処理と競合してしまうため）。
 * - 最終問題の保存に失敗した場合のみ、採点済み(hasAnsweredCurrent)のままボタンが再度押されるため、
 *   その場合は採点をやり直させず、保存のみをリトライする。
 *
 * MVP10での変更点:
 * - 最終問題に回答した後は自動で新しいセッションを開始せず、1回の学習を1セッションとして
 *   scoresへ保存し、結果画面（ResultScreen）を表示する（useSessionCompletionに保存処理を委譲）
 * - 結果画面の「もう一度挑戦する」を押した場合のみ、useCardSessionのhandleRetryで
 *   新しいセッション（カード再シャッフル・進捗リセット）を開始する
 *
 * レイアウト・データ取得はStudyScreen/useStudyCardsへ委譲し、
 * このファイルには「word固有の自己採点タイミング制御」とセッション完了制御のみを残す設計とした
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

  // 最終問題であれば学習セッションを完了させてscoresへ保存する
  const handleSessionComplete = useCallback(
    (finalCorrectCount: number) => {
      completeSession(finalCorrectCount, total);
    },
    [completeSession, total]
  );

  // 「次のカード」ボタン押下時のハンドラ
  // 裏面を確認済み(isFlipped)の状態でのみ押せる（StudyScreen側のisNextDisabledで制御）
  const handleNextRequest = useCallback(() => {
    // 既に採点済みの状態でボタンが押されるのは、最終問題の保存に失敗し
    // 再度「結果を見る」が押されたケースのみ。この場合は採点をやり直させず保存だけ再試行する
    if (hasAnsweredCurrent) {
      handleSessionComplete(correctCount);
      return;
    }

    openModal("score", undefined, (actionKey) => {
      const isCorrect = actionKey === "correct";
      recordAnswer(isCorrect);

      if (isLastCard) {
        // correctCountのstate更新はまだこの時点では反映されていないため、
        // 今回の採点結果を加算した値をその場で計算して保存に使用する
        handleSessionComplete(correctCount + (isCorrect ? 1 : 0));
      } else {
        goToNextCard();
      }
    });
  }, [
    hasAnsweredCurrent,
    handleSessionComplete,
    correctCount,
    openModal,
    recordAnswer,
    isLastCard,
    goToNextCard,
  ]);

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
      isNextDisabled={!isFlipped}
      onNext={handleNextRequest}
      onRetry={handleNextRequest}
      isProcessing={isSaving}
      lastCardLabel="結果を見る"
      toggleHint="BB-8トグルで裏面（解答）を確認してください"
    />
  );
}
