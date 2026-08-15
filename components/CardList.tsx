'use client';

import React from 'react';
import { Card } from '@/types/card';

interface CardListProps {
  cards: Card[];
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onSeedTestData?: () => void;
}

/**
 * カード一覧表示コンポーネント (Requirement 12 & 16)
 * 
 * 取得した `cards` テーブルのデータを受け取り、表面 (front_text) と裏面 (back_text) を一覧表示します。
 * 
 * 役割分離 (Requirement 14):
 * - このコンポーネントは純粋な UI プレゼンテーション層です。
 * - Supabaseへの直接のデータ通信は行わず、親コンポーネントから渡された props (`cards`, `error` など) のレンダリングに専念します。
 */
export function CardList({
  cards,
  isLoading = false,
  error = null,
  onRefresh,
  onSeedTestData,
}: CardListProps) {
  // 1. ローディング状態の表示
  if (isLoading) {
    return (
      <div className="w-full max-w-3xl mx-auto p-8 text-center bg-slate-900/40 border border-slate-800 rounded-2xl animate-pulse">
        <div className="h-6 w-32 bg-slate-800 rounded mx-auto mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="h-28 bg-slate-800/60 rounded-xl" />
          <div className="h-28 bg-slate-800/60 rounded-xl" />
          <div className="h-28 bg-slate-800/60 rounded-xl" />
        </div>
      </div>
    );
  }

  // 2. エラー状態の表示 (Requirement 15: カード取得失敗の明確化)
  if (error) {
    return (
      <div className="w-full max-w-3xl mx-auto p-6 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-200 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-red-400 flex items-center gap-2">
            <span>🚨</span> カード取得エラー
          </h3>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-xs font-semibold rounded-lg transition"
            >
              再試行
            </button>
          )}
        </div>
        <p className="text-sm text-slate-300">{error}</p>
      </div>
    );
  }

  // 3. データが0件の場合の表示 (Requirement 15: カードが存在しない)
  if (cards.length === 0) {
    return (
      <div className="w-full max-w-3xl mx-auto p-8 text-center bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4">
        <div className="text-4xl">🎴</div>
        <h3 className="text-lg font-bold text-slate-200">登録されているカードはありません</h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          PostgreSQLの RLS (Row Level Security) により、ログイン中ユーザーに紐づくカードのみが表示されます。
        </p>
        {onSeedTestData && (
          <div className="pt-2">
            <button
              onClick={onSeedTestData}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition"
            >
              ＋ テスト用初期カードを登録する
            </button>
          </div>
        )}
      </div>
    );
  }

  // 4. カード一覧の正常表示
  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <span>Cards</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-indigo-400 font-mono">
            {cards.length} 件
          </span>
        </h2>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="text-xs text-slate-400 hover:text-slate-200 transition flex items-center gap-1"
          >
            🔄 更新
          </button>
        )}
      </div>

      {/* カードグリッド */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div
            key={card.id}
            className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 transition-all duration-200 space-y-3 shadow-lg group relative overflow-hidden"
          >
            {/* 表面 (Front) */}
            <div>
              <span className="text-[10px] font-mono tracking-wider text-indigo-400 uppercase font-semibold">
                FRONT
              </span>
              <p className="text-lg font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                {card.front_text}
              </p>
            </div>

            {/* 区切り線 */}
            <div className="border-t border-slate-800/80" />

            {/* 裏面 (Back) */}
            <div>
              <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-semibold">
                BACK
              </span>
              <p className="text-sm font-medium text-slate-300">
                {card.back_text}
              </p>
            </div>

            {/* IDバッジ */}
            <div className="pt-1 text-[10px] font-mono text-slate-400 truncate">
              ID: {card.id.substring(0, 8)}...
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
