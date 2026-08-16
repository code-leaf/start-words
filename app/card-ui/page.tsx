"use client";

import React, { useState, useEffect } from "react";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { fetchUserCards } from "@/lib/cards";
import { Card } from "@/types/card";
import { FlashCard } from "@/components/FlashCard";
import { BB8Toggle } from "@/components/BB8Toggle";
import { CardNavigation } from "@/components/CardNavigation";
import "./bb8-toggle.css";
import "./flash-card.css";

/**
 * 共通カードUI検証用ページ (/card-ui)
 * 
 * 目的:
 * - MVP 1で取得したカードデータを利用し、共通カードUI（表示・反転・次送り）の動作を検証
 * - FlashCard、BB8Toggle、CardNavigationを組み合わせて1枚ずつの学習フローを制御
 */
export default function CardUIPage() {
  // Supabaseから取得したカード配列を保持
  const [cards, setCards] = useState<Card[]>([]);

  // 現在表示しているカードのインデックス（0始まり）
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // 現在のカードが裏面（解答）に反転しているかどうかのフラグ
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  // データ読み込み中フラグ
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // データ取得時のエラーメッセージ
  const [error, setError] = useState<string | null>(null);

  // Supabaseクライアントの初期化
  const supabase = createBrowserClient();

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

  // 次のカードへ進む処理
  const handleNextCard = () => {
    if (currentIndex < cards.length - 1) {
      // 次のインデックスに進める
      setCurrentIndex((prev) => prev + 1);
      // 次のカードを表面から学習できるように反転状態を初期化
      setIsFlipped(false);
    }
  };

  // 最終カードに到達しているかどうかの判定（最後のカードでボタンを非活性化）
  const isLastCard = currentIndex >= cards.length - 1;

  // 現在表示対象のカードデータ
  const currentCard = cards[currentIndex];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-between p-4 sm:p-8">
      {/* 画面ヘッダー */}
      <header className="w-full max-w-xl text-center py-4">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">
          共通カードUI 検証
        </h1>
        {cards.length > 0 && !isLoading && !error && (
          <p className="text-sm font-medium text-slate-500 mt-1">
            Card {currentIndex + 1} / {cards.length}
          </p>
        )}
      </header>

      {/* メインコンテンツエリア */}
      <main className="w-full max-w-xl flex-1 flex flex-col items-center justify-center">
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
        {!isLoading && !error && cards.length === 0 && (
          <div className="w-full text-center py-16 px-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-lg font-medium text-slate-700">
              カードが登録されていません
            </p>
            <p className="text-sm text-slate-400 mt-2">
              トップ画面でテストカードを作成・登録してから再度お試しください。
            </p>
          </div>
        )}

        {/* カードUI・トグル・次へボタンのレンダリング（データが存在する場合のみ） */}
        {!isLoading && !error && cards.length > 0 && currentCard && (
          <div className="w-full flex flex-col items-center gap-6 sm:gap-8">
            {/* 1. フラッシュカード表示（3D反転・切り替えアニメーション） */}
            <FlashCard card={currentCard} isFlipped={isFlipped} />

            {/* 2. BB-8反転トグルスイッチ */}
            <div className="flex flex-col items-center">
              <BB8Toggle
                checked={isFlipped}
                onChange={setIsFlipped}
                bgVariant={1}
              />
            </div>

            {/* 3. ナビゲーション（次のカードボタン） */}
            <div className="mt-2">
              <CardNavigation
                onNext={handleNextCard}
                disabled={isLastCard}
              />
            </div>
          </div>
        )}
      </main>

      {/* 画面フッター */}
      <footer className="w-full max-w-xl text-center py-4 text-xs text-slate-400">
        start-words MVP 2 — Common Card UI
      </footer>
    </div>
  );
}
