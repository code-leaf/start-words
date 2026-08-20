'use client';

import React from 'react';

// CardNavigationコンポーネントのProps型定義
export type CardNavigationProps = {
  // 最終カードに到達しているかどうかのフラグ
  isLastCard: boolean;
  // 「次のカード」ボタン押下時のコールバック関数
  onNext: () => void;
  // 最終カード到達時のボタン押下時のコールバック関数（呼び出し元によって「リトライ」「セッション完了」等、意味が異なる）
  onRetry: () => void;
  // 未回答のまま次へ進めないようにするための非活性化フラグ
  disabled?: boolean;
  // 処理中（保存中など）フラグ。trueの間はボタンを非活性化し、ラベルを「保存中...」に切り替える (MVP10)
  isProcessing?: boolean;
  // 最終カード到達時のボタンラベル（省略時は「また挑戦する！」。MVP10のword/errataでは「結果を見る」を指定する）
  lastCardLabel?: string;
};

/**
 * カード学習画面のナビゲーション操作コンポーネント
 *
 * 目的:
 * - 通常時は「次のカード」ボタンを提供し、進行操作を担当
 * - 最終カード到達時は同一ボタン位置でラベルを切り替え、onRetryを呼び出す
 *   （ラベル・onRetryの実際の意味は呼び出し元に委ねる。例: card-uiページでは「また挑戦する！」＝即時リトライ、
 *     word/errataページでは「結果を見る」＝学習セッション完了処理）
 * - 採点モーダルで未回答の間は、採点をスキップして進めないようdisabledにする
 */
export function CardNavigation({
  isLastCard,
  onNext,
  onRetry,
  disabled = false,
  isProcessing = false,
  lastCardLabel = 'また挑戦する！',
}: CardNavigationProps) {
  const isDisabled = disabled || isProcessing;

  return (
    <div className='flex justify-center items-center'>
      <button
        type='button'
        onClick={isLastCard ? onRetry : onNext}
        disabled={isDisabled}
        className={`px-8 py-3 rounded-full font-semibold text-base transition-all duration-200 shadow-md select-none active:scale-95 ${
          isDisabled
            ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none active:scale-100'
            : isLastCard
              ? 'bg-amber-600 text-white hover:bg-amber-500 shadow-amber-600/20 cursor-pointer'
              : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/10 cursor-pointer'
        }`}
      >
        {isProcessing ? '保存中...' : isLastCard ? lastCardLabel : '次のカード'}
      </button>
    </div>
  );
}