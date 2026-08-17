"use client";

import { useState, useEffect } from "react";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { fetchUserCards } from "@/lib/cards";
import { Card } from "@/types/card";

/**
 * 学習画面共通のカード取得フック
 *
 * 目的:
 * - word/errata画面で完全に重複していた「マウント時にログイン中ユーザーのカードを取得する」処理を一元化
 * - Supabaseクライアントの生成・fetchUserCards呼び出し・ローディング/エラー状態管理を1箇所に集約
 */
export function useStudyCards() {
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Supabaseクライアントをエフェクト内で生成することで、
    // レンダーのたびにクライアントが再生成されレンダーループが起きる問題を回避する
    const supabase = createBrowserClient();

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
  }, []); // マウント時1回のみ実行（supabaseはエフェクト内で生成するため依存配列不要）

  return { cards, isLoading, error };
}
