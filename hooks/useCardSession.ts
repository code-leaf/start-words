"use client";

import { useState, useCallback } from "react";
import { Card } from "@/types/card";

/**
 * 配列の要素をランダムにシャッフルするユーティリティ関数 (Fisher-Yatesアルゴリズム)
 * 
 * 目的:
 * - 元の配列を変更せずに、ランダム順に並び替えた新しい配列を生成
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * 共通カード学習セッション管理フック
 * 
 * 設計方針・共通化の背景:
 * - word学習（めくって確認）と errata学習（入力して確認）の差分は「回答入力欄の有無」のみです。
 * - カードのシャッフル、進捗インデックス管理、反転制御、正誤判定・正解数カウント、
 *   リトライ処理といった学習セッション全体のロジックは本フックで一元化し、
 *   将来的に errata 機能でも本フックをそのまま共有する設計としています。
 * 
 * @param cards 学習対象のカード配列
 */
export function useCardSession(cards: Card[]) {
  // 前回のcards参照を保持（引数の変更検知用）
  const [prevCards, setPrevCards] = useState<Card[]>(cards);
  // シャッフルされたカード一覧
  const [shuffledCards, setShuffledCards] = useState<Card[]>(() =>
    shuffleArray(cards)
  );
  // 現在表示中のカードインデックス（0始まり）
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  // 現在のカードが裏面（解答）に反転しているかどうかのフラグ
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  // 正解した問題数
  const [correctCount, setCorrectCount] = useState<number>(0);
  // 現在表示中のカードに対して既に回答済みかどうかのフラグ
  const [hasAnsweredCurrent, setHasAnsweredCurrent] = useState<boolean>(false);

  // 引数の cards が変更された場合、レンダー中にシャッフル及び各ステートを初期化
  if (cards !== prevCards) {
    setPrevCards(cards);
    setShuffledCards(shuffleArray(cards));
    setCurrentIndex(0);
    setIsFlipped(false);
    setCorrectCount(0);
    // カードリスト変更時に回答状態を初期化
    setHasAnsweredCurrent(false);
  }

  // 反転状態を更新するハンドラ
  const flip = useCallback((value: boolean) => {
    setIsFlipped(value);
  }, []);

  // カードの総数
  const total = shuffledCards.length;

  // 最終カードに到達しているかどうかの判定フラグ
  const isLastCard = total > 0 && currentIndex >= total - 1;

  // 現在表示対象のカード
  const currentCard = shuffledCards[currentIndex] ?? null;

  // 正解／不正解の回答を記録する処理（画面遷移・反転解除は行わず、スコアと回答状態のみ更新）
  const recordAnswer = useCallback((isCorrect: boolean) => {
    // 正解の場合は正解数をインクリメント
    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
    }
    // 現在のカードに対して回答済み状態を記録（同一カードへの二重採点を防止）
    setHasAnsweredCurrent(true);
  }, []);

  // 次のカードへ進む処理（最終問題時は最初からリスタート）
  const goToNextCard = useCallback(() => {
    // 最終カードでなければ次の問題へ進み、反転状態と回答済みフラグをリセット
    if (currentIndex < shuffledCards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
      // 新しいカードで再度採点可能にするため回答済みフラグをリセット
      setHasAnsweredCurrent(false);
    } else {
      // 最終カード到達時はカードを再シャッフルし、初期状態から再スタート
      setShuffledCards(shuffleArray(cards));
      setCurrentIndex(0);
      setIsFlipped(false);
      setCorrectCount(0);
      setHasAnsweredCurrent(false);
    }
  }, [cards, currentIndex, shuffledCards.length]);

  // 再挑戦（リトライ）処理: カードを再シャッフルし、初期状態から再スタート
  const handleRetry = useCallback(() => {
    setShuffledCards(shuffleArray(cards));
    setCurrentIndex(0);
    setIsFlipped(false);
    setCorrectCount(0);
    // 新規セッション開始時に同一カード判定用フラグを初期化
    setHasAnsweredCurrent(false);
  }, [cards]);

  return {
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
  };
}
