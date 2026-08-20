"use client";

import React from "react";
import { Card } from "@/types/card";
import { FlashCard } from "@/components/FlashCard";
import { BB8Toggle } from "@/components/BB8Toggle";
import { CardNavigation } from "@/components/CardNavigation";

// StudyScreenコンポーネントのProps型定義
export type StudyScreenProps = {
  // 画面タイトル（word/errataで文言のみ異なる）
  title: string;
  // データ読み込み中フラグ
  isLoading: boolean;
  // データ取得時のエラーメッセージ
  error: string | null;
  // カード総数
  total: number;
  // 現在のカードインデックス（0始まり）
  currentIndex: number;
  // 正解数
  correctCount: number;
  // 現在表示中のカード
  currentCard: Card | null;
  // カードが裏面反転中かどうか
  isFlipped: boolean;
  // 反転状態を更新するハンドラ
  flip: (value: boolean) => void;
  // 汎用モーダルが開いているかどうか（BB-8トグルの誤操作防止用）
  isModalOpen: boolean;
  // 最終カードに到達しているかどうか
  isLastCard: boolean;
  // 現在のカードに回答済みかどうか（次へボタンの活性制御用）
  hasAnsweredCurrent: boolean;
  // 「次のカード」ボタン押下時のハンドラ
  onNext: () => void;
  // 最終カード到達時のボタン押下時のハンドラ（呼び出し元によって意味が異なる。CardNavigation参照）
  onRetry: () => void;
  // 処理中（保存中など）フラグ。ナビゲーションボタンを非活性化する (MVP10)
  isProcessing?: boolean;
  // 最終カード到達時のボタンラベル（省略時はCardNavigationのデフォルトに従う） (MVP10)
  lastCardLabel?: string;
  // BB-8トグル下に表示する操作案内文言（word/errataで文言が異なる）
  toggleHint: string;
  // FlashCardとBB8Toggleの間に差し込む入力欄（errataのみAnswerInputを渡す。wordは未指定）
  inputSlot?: React.ReactNode;
};

/**
 * word/errata共通の学習画面プレゼンテーションコンポーネント
 *
 * 目的:
 * - ヘッダー・進捗表示・ローディング/エラー/0件表示・FlashCard・BB-8トグル・
 *   ナビゲーションといったUI構造を1箇所に集約し、word/errata間でのレイアウト重複を排除する
 * - word/errataの唯一の構造差分である「回答入力欄の有無」はinputSlotスロットで注入する
 * - このファイルを修正すれば、word/errata両画面のレイアウト・レスポンシブ対応が同時に反映される
 *
 * レスポンシブ方針:
 * - h-dvh（動的ビューポート高さ）+ overflow-hiddenにより、縦幅もPC・スマホの画面内に収まる設計とする
 * - SP時は余白・gapを詰めて、errataの入力欄追加分の高さを吸収する
 */
export function StudyScreen({
  title,
  isLoading,
  error,
  total,
  currentIndex,
  correctCount,
  currentCard,
  isFlipped,
  flip,
  isModalOpen,
  isLastCard,
  hasAnsweredCurrent,
  onNext,
  onRetry,
  isProcessing = false,
  lastCardLabel,
  toggleHint,
  inputSlot,
}: StudyScreenProps) {
  return (
    <div className="h-dvh overflow-hidden bg-slate-100 flex flex-col items-center justify-between p-3 sm:p-6">
      {/* 画面ヘッダー */}
      <header className="w-full max-w-xl text-center py-2 sm:py-4 shrink-0">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">
          {title}
        </h1>

        {/* 学習進捗・正解数の常時表示 */}
        {total > 0 && !isLoading && !error && (
          <div className="flex items-center justify-center gap-4 mt-2">
            <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-600 shadow-2xs">
              進捗: {currentIndex + 1} / {total}
            </span>
            <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-semibold text-emerald-700 shadow-2xs">
              正解数: {correctCount}
            </span>
          </div>
        )}
      </header>

      {/* メインコンテンツエリア */}
      <main className="w-full max-w-xl flex-1 min-h-0 flex flex-col items-center justify-center">
        {/* ローディング表示 */}
        {isLoading && (
          <div className="text-center py-12 text-slate-500 font-medium animate-pulse">
            カードを読み込み中...
          </div>
        )}

        {/* データ取得エラー表示 */}
        {!isLoading && error && (
          <div className="w-full p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center">
            <p className="font-semibold">エラーが発生しました</p>
            <p className="mt-1">{error}</p>
          </div>
        )}

        {/* カード未登録（0件）時の表示 */}
        {!isLoading && !error && total === 0 && (
          <div className="w-full text-center py-16 px-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-lg font-medium text-slate-700">
              カードが登録されていません
            </p>
            <p className="text-sm text-slate-400 mt-2">
              トップ画面でテストカードを作成・登録してから再度お試しください。
            </p>
          </div>
        )}

        {/* 学習カードUI（データが存在する場合のみ表示） */}
        {!isLoading && !error && total > 0 && currentCard && (
          <div className="w-full h-full flex flex-col items-center gap-3 sm:gap-6">
            {/* 1. フラッシュカード表示（3D反転・切り替えアニメーション）
                   flex-1 min-h-0 でmain内の残り高さをこのラッパーが吸収し、
                   .card-container / .card がそのスペースいっぱいに広がれるようにする */}
            <div className="w-full flex-1 min-h-0 flex items-center justify-center">
              <FlashCard card={currentCard} isFlipped={isFlipped} />
            </div>

            {/* 2. 回答入力欄スロット（errataのみAnswerInputが渡される。wordはundefinedのため非表示） */}
            {inputSlot}

            {/* 3. BB-8反転トグルスイッチ（モーダル表示中は誤操作防止のためdisabled） */}
            <div className="flex flex-col items-center">
              <BB8Toggle
                checked={isFlipped}
                onChange={flip}
                bgVariant={1}
                disabled={isModalOpen}
              />
              <p className="text-xs text-slate-400 mt-2">{toggleHint}</p>
            </div>

            {/* 4. ナビゲーション（通常時は次へ進行、最終問題到達時は「また挑戦する！」） */}
            <div className="mt-1 sm:mt-2">
              <CardNavigation
                isLastCard={isLastCard}
                onNext={onNext}
                onRetry={onRetry}
                disabled={!hasAnsweredCurrent}
                isProcessing={isProcessing}
                lastCardLabel={lastCardLabel}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
