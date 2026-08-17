"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { fetchUserCards } from "@/lib/cards";
import { Card } from "@/types/card";
import { useCardSession } from "@/hooks/useCardSession";
import { useErrataAnswer } from "@/hooks/useErrataAnswer";
import { useModal } from "@/contexts/ModalContext";
import { isAnswerCorrect } from "@/lib/judgeAnswer";
import { FlashCard } from "@/components/FlashCard";
import { BB8Toggle } from "@/components/BB8Toggle";
import { CardNavigation } from "@/components/CardNavigation";
import { AnswerInput } from "@/components/AnswerInput";
import "@/styles/card-ui/bb8-toggle.css";
import "@/styles/card-ui/flash-card.css";

/**
 * 回答入力型学習画面コンポーネント (/errata)
 *
 * 目的:
 * - word学習（自己採点）と異なり、ユーザーが回答を入力してからカードをめくることで
 *   自動的に正誤判定を行う学習フローを提供する
 *
 * word学習との差分:
 * - useErrataAnswer フックによる回答入力値の管理
 * - FlashCard と BB8Toggle の間に AnswerInput を配置
 * - カードをめくった際に isAnswerCorrect で自動判定し、
 *   正解/不正解に応じた通知モーダル（errataCorrect/errataIncorrect）を表示
 * - 次のカードへ進む前に必ず入力値をリセットする（handleAdvance）
 *
 * セッション管理を useCardSession に完全委譲している理由:
 * - カード進行・スコア・反転・リトライは word 学習と共通ロジックのため、
 *   errata 専用に再実装せず useCardSession をそのまま流用する設計とした
 */
export default function ErrataStudyPage() {
  // Supabaseから取得した生のカード一覧
  const [cards, setCards] = useState<Card[]>([]);
  // データ読み込み中フラグ
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // データ取得時のエラーメッセージ
  const [error, setError] = useState<string | null>(null);

  // 汎用モーダル操作フック（モーダル開閉および表示状態の取得）
  const { openModal, isOpen } = useModal();

  // Supabaseクライアントの初期化
  const supabase = createBrowserClient();

  // カード学習セッションの管理（シャッフル・進捗・反転・正解数・回答状態・次進行）
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
  // goToNextCard を直接 onNext/onRetry に渡すと入力値が残ったまま次の問題に移るため、
  // 必ずここで reset を先行させてから進行する
  const handleAdvance = useCallback(() => {
    resetAnswer();
    goToNextCard();
  }, [resetAnswer, goToNextCard]);

  // マウント時にMVP 1流用のデータ取得ロジックでカード一覧を取得
  useEffect(() => {
    const loadCards = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Supabase cardsテーブルからログイン中ユーザーのカードを取得
        const result = await fetchUserCards(supabase);

        if (result.error) {
          setError(result.error);
        } else {
          setCards(result.cards);
        }
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "予期せぬエラーが発生しました";
        setError(`データ取得エラー: ${msg}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadCards();
  }, [supabase]);

  return (
    <div className='min-h-screen bg-slate-100 flex flex-col items-center justify-between p-4 sm:p-8'>
      {/* 画面ヘッダー */}
      <header className='w-full max-w-xl text-center py-4'>
        <h1 className='text-xl font-bold text-slate-800 tracking-tight'>
          単語学習 (errata)
        </h1>

        {/* 学習進捗・正解数の常時表示 */}
        {total > 0 && !isLoading && !error && (
          <div className='flex items-center justify-center gap-4 mt-2'>
            <span className='px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-600 shadow-2xs'>
              進捗: {currentIndex + 1} / {total}
            </span>
            <span className='px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-semibold text-emerald-700 shadow-2xs'>
              正解数: {correctCount}
            </span>
          </div>
        )}
      </header>

      {/* メインコンテンツエリア */}
      <main className='w-full max-w-xl flex-1 flex flex-col items-center justify-center'>
        {/* ローディング表示 */}
        {isLoading && (
          <div className='text-center py-12 text-slate-500 font-medium animate-pulse'>
            カードを読み込み中...
          </div>
        )}

        {/* データ取得エラー表示 */}
        {!isLoading && error && (
          <div className='w-full p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center'>
            <p className='font-semibold'>エラーが発生しました</p>
            <p className='mt-1'>{error}</p>
          </div>
        )}

        {/* カード未登録（0件）時の表示 */}
        {!isLoading && !error && total === 0 && (
          <div className='w-full text-center py-16 px-4 bg-white rounded-2xl border border-slate-200 shadow-sm'>
            <p className='text-lg font-medium text-slate-700'>
              カードが登録されていません
            </p>
            <p className='text-sm text-slate-400 mt-2'>
              トップ画面でテストカードを作成・登録してから再度お試しください。
            </p>
          </div>
        )}

        {/* 学習カードUI（データが存在する場合のみ表示） */}
        {!isLoading && !error && total > 0 && currentCard && (
          <div className='w-full flex flex-col items-center gap-6 sm:gap-8'>
            {/* 1. フラッシュカード表示（3D反転・切り替えアニメーション） */}
            <FlashCard card={currentCard} isFlipped={isFlipped} />

            {/* 2. 回答入力欄（FlashCardとBB8Toggleの間に配置）
                   採点済み（hasAnsweredCurrent）またはモーダル表示中（isOpen）は入力不可にし、
                   めくり後に入力値を変更できないようにして判定結果との不整合を防ぐ */}
            <AnswerInput
              value={inputValue}
              onChange={setInputValue}
              disabled={hasAnsweredCurrent || isOpen}
            />

            {/* 3. BB-8反転トグルスイッチ（モーダル表示中は誤操作防止のためdisabled） */}
            <div className='flex flex-col items-center'>
              <BB8Toggle
                checked={isFlipped}
                onChange={flip}
                bgVariant={1}
                disabled={isOpen}
              />
              <p className='text-xs text-slate-400 mt-2'>
                BB-8トグルで回答を確定し、採点してください
              </p>
            </div>

            {/* 4. ナビゲーション（通常時は次へ進行、最終問題到達時は「また挑戦する！」）
                   handleAdvance で入力値リセット → goToNextCard の順に実行 */}
            <div className='mt-2'>
              <CardNavigation
                isLastCard={isLastCard}
                onNext={handleAdvance}
                onRetry={handleAdvance}
                disabled={!hasAnsweredCurrent}
              />
            </div>
          </div>
        )}
      </main>

      {/* 画面フッター */}
      <footer className='w-full max-w-xl text-center py-4 text-xs text-slate-400'>
        start-words MVP 4 — Errata Study Mode
      </footer>
    </div>
  );
}
