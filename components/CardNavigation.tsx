"use client";

import React from "react";

// CardNavigationコンポーネントのProps型定義
export type CardNavigationProps = {
  // 「次のカード」ボタン押下時のコールバック関数
  onNext: () => void;
  // 最終カード到達時等にボタンを無効化するフラグ
  disabled: boolean;
};

/**
 * カード学習画面のナビゲーション操作コンポーネント
 * 
 * 目的:
 * - 次のカードへ進むユーザー操作ボタンを提供
 * - 最後のカードまで到達した場合はボタンを非活性化（disabled）して誤操作を防止
 */
export function CardNavigation({ onNext, disabled }: CardNavigationProps) {
  return (
    <div className="flex justify-center items-center">
      {/* 次のカードへ進むアクションボタン */}
      <button
        type="button"
        onClick={onNext}
        disabled={disabled}
        className={`px-8 py-3 rounded-full font-medium text-base transition-all duration-200 shadow-md select-none ${
          disabled
            ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
            : "bg-slate-900 text-white hover:bg-slate-800 active:scale-95 cursor-pointer shadow-slate-900/10"
        }`}
      >
        次のカード
      </button>
    </div>
  );
}
