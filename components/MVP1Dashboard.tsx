'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { Card } from '@/types/card';
import { fetchUserCards, insertCard } from '@/lib/cards';
import { CardList } from '@/components/CardList';
import { AuthSessionControl } from '@/components/AuthSessionControl';
import { RLSTestPanel } from '@/components/RLSTestPanel';
import { User } from '@supabase/supabase-js';

interface MVP1DashboardProps {
  initialUser: User | null;
  initialCards: Card[];
  initialError: string | null;
  isConfigured: boolean;
}

/**
 * MVP 1 メインダッシュボードコンポーネント
 * 
 * 画面上の「認証状態」「カード一覧」「RLS検証パネル」を統括するクライアントコンポーネントです。
 */
export function MVP1Dashboard({
  initialUser,
  initialCards,
  initialError,
  isConfigured,
}: MVP1DashboardProps) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [cards, setCards] = useState<Card[]>(initialCards);
  const [error, setError] = useState<string | null>(initialError);
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createBrowserClient();

  // 最新の認証ユーザーとカード一覧を取得
  const refreshData = useCallback(async () => {
    if (!isConfigured) return;
    setIsLoading(true);
    setError(null);

    try {
      // 1. 現在の認証ユーザーを取得
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      setUser(currentUser);

      // 2. カード一覧を取得 (lib/cards.ts のデータアクセスメソッドを呼び出し)
      // 注意: SELECTクエリに user_id 条件を追加せず、RLSポリシーに依拠しています。
      const result = await fetchUserCards(supabase);
      setCards(result.cards);
      setError(result.error);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'データ読み込みエラー';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [isConfigured, supabase]);

  // セッション変更イベントの監視
  useEffect(() => {
    if (!isConfigured) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      refreshData();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isConfigured, supabase, refreshData]);

  // テスト用初期カードを一括登録する処理 (Requirement 10)
  const handleSeedTestData = async () => {
    if (!user) {
      alert('テスト用カードを追加するには、先にログインしてください。');
      return;
    }

    setIsLoading(true);
    const testItems = [
      { front_text: 'apple', back_text: 'りんご' },
      { front_text: 'book', back_text: '本' },
      { front_text: 'study', back_text: '勉強する' },
    ];

    let successCount = 0;
    for (const item of testItems) {
      const res = await insertCard(supabase, {
        user_id: user.id, // 自分の user_id で登録 (RLS INSERT ポリシーに適合)
        front_text: item.front_text,
        back_text: item.back_text,
      });
      if (res.card) successCount++;
    }

    alert(`${successCount} 件のテストカードを投入しました！`);
    refreshData();
  };

  return (
    <div className="w-full space-y-8">
      {/* 1. 認証セッション制御 */}
      <AuthSessionControl user={user} onSessionChange={refreshData} />

      {/* 2. カード一覧表示 */}
      <CardList
        cards={cards}
        isLoading={isLoading}
        error={error}
        onRefresh={refreshData}
        onSeedTestData={handleSeedTestData}
      />

      {/* 3. RLS 自動検証パネル */}
      <RLSTestPanel currentUserId={user?.id ?? null} />
    </div>
  );
}
