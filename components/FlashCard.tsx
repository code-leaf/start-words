"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/types/card";

// FlashCardコンポーネントのProps型定義
export type FlashCardProps = {
  // 表示対象のカードデータ
  card: Card;
  // カードが裏面（解答）に反転しているかどうかのフラグ
  isFlipped: boolean;
};

/**
 * 1枚のカードを表示するフラッシュカードコンポーネント
 * 
 * 目的:
 * - 単語の表面（問題）と裏面（解答）を3D回転アニメーションで切り替え表示
 * - 次のカードへの切り替え時に、150msの縮小・フェードアウトアニメーションを実行してスムーズな遷移を提供
 */
export function FlashCard({ card, isFlipped }: FlashCardProps) {
  // 表示中のカードデータを保持
  const [displayedCard, setDisplayedCard] = useState<Card>(card);
  // 前回のカードIDを追跡（Propsの変更検知用）
  const [prevCardId, setPrevCardId] = useState<string>(card.id);
  // カード切り替えアニメーション中フラグ
  const [isSwitching, setIsSwitching] = useState<boolean>(false);

  // Propsのcardが切り替わった場合、レンダー中に切り替えフラグを立てる
  if (card.id !== prevCardId) {
    setPrevCardId(card.id);
    setIsSwitching(true);
  }

  // 切り替えアニメーション（150ms）後に中身を新しいカードへ差し替え
  useEffect(() => {
    if (!isSwitching) return;

    const timer = setTimeout(() => {
      setDisplayedCard(card);
      setIsSwitching(false);
    }, 150);

    return () => clearTimeout(timer);
  }, [isSwitching, card]);

  return (
    <div className="card-container">
      <div
        className={`card ${isFlipped ? "is-flipped" : ""} ${
          isSwitching ? "switching" : ""
        }`}
      >
        {/* カード表面（問題・英単語） */}
        <div className="front">
          <span className="text-top">QUESTION</span>
          <span className="text text-center">{displayedCard.front_text}</span>
        </div>

        {/* カード裏面（解答・日本語訳） */}
        <div className="back">
          <span className="text-top">ANSWER</span>
          <span className="text text-center">{displayedCard.back_text}</span>
        </div>
      </div>
    </div>
  );
}
