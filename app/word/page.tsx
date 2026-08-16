"use client";

import React, { useState, useEffect } from "react";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { fetchUserCards } from "@/lib/cards";
import { Card } from "@/types/card";
import { useCardSession } from "@/hooks/useCardSession";
import { useModal } from "@/contexts/ModalContext";
import { FlashCard } from "@/components/FlashCard";
import { BB8Toggle } from "@/components/BB8Toggle";
import { CardNavigation } from "@/components/CardNavigation";
import "@/styles/card-ui/bb8-toggle.css";
import "@/styles/card-ui/flash-card.css";

/**
 * 単語学習画面コンポーネント (/word)
 * 
 * 目的:
 * - Supabaseから取得したカードを使って、シャッフル単語学習フロー（めくり → 汎用自己採点モーダル → 次へ進行）を提供
 * - 共通セッションフック (useCardSession) により、進捗管理・正誤記録・次カード進行・リトライ制御を一元管理
 */
export default function WordStudyPage() {
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

  // カード裏面（解答）表示かつ未回答の場合、自動で自己採点モーダルを開く
  useEffect(() => {
    if (isFlipped && !hasAnsweredCurrent) {
      openModal("score", undefined, (actionKey) => {
        // 'correct' アクション時は正解(true)、それ以外('incorrect'等)は不正解(false)として記録
        recordAnswer(actionKey === "correct");
      });
    }
  }, [isFlipped, hasAnsweredCurrent, openModal, recordAnswer]);

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
          単語学習 (word)
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

            {/* 2. BB-8反転トグルスイッチ（モーダル表示中は誤操作防止のためdisabled） */}
            <div className='flex flex-col items-center'>
              <BB8Toggle
                checked={isFlipped}
                onChange={flip}
                bgVariant={1}
                disabled={isOpen}
              />
              <p className='text-xs text-slate-400 mt-2'>
                BB-8トグルで裏面（解答）を確認してください
              </p>
            </div>

            {/* 3. ナビゲーション（通常時は次へ進行、最終問題到達時は「また挑戦する！」） */}
            <div className='mt-2'>
              <CardNavigation
                isLastCard={isLastCard}
                onNext={goToNextCard}
                onRetry={goToNextCard}
                disabled={!hasAnsweredCurrent}
              />
            </div>
          </div>
        )}
      </main>

      {/* 画面フッター */}
      <footer className='w-full max-w-xl text-center py-4 text-xs text-slate-400'>
        start-words MVP 3 — Word Study Mode
      </footer>
    </div>
  );
}
