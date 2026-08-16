'use client';

import React from 'react';

// CardNavigationコンポーネントのProps型定義
export type CardNavigationProps = {
  // 最終カードに到達しているかどうかのフラグ
  isLastCard: boolean;
  // 「次のカード」ボタン押下時のコールバック関数
  onNext: () => void;
  // 「また挑戦する！」ボタン押下時のリトライコールバック関数
  onRetry: () => void;
  // 未回答のまま次へ進めないようにするための非活性化フラグ
  disabled?: boolean;
};

/**
 * カード学習画面のナビゲーション操作コンポーネント
 *
 * 目的:
 * - 通常時は「次のカード」ボタンを提供し、進行操作を担当
 * - 最終カード到達時は同一ボタン位置で「また挑戦する！」へラベルを切り替え、再挑戦操作を提供
 * - 採点モーダルで未回答の間は、採点をスキップして進めないようdisabledにする
 */
export function CardNavigation({
  isLastCard,
  onNext,
  onRetry,
  disabled = false,
}: CardNavigationProps) {
  return (
    <div className='flex justify-center items-center'>
      <button
        type='button'
        onClick={isLastCard ? onRetry : onNext}
        disabled={disabled}
        className={`px-8 py-3 rounded-full font-semibold text-base transition-all duration-200 shadow-md select-none active:scale-95 ${
          disabled
            ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none active:scale-100'
            : isLastCard
              ? 'bg-amber-600 text-white hover:bg-amber-500 shadow-amber-600/20 cursor-pointer'
              : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/10 cursor-pointer'
        }`}
      >
        {isLastCard ? 'また挑戦する！' : '次のカード'}
      </button>
    </div>
  );
}