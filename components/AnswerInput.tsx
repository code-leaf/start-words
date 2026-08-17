"use client";

import React from "react";

// AnswerInputコンポーネントのProps型定義
export type AnswerInputProps = {
  // 入力欄の現在値
  value: string;
  // 入力値変更時のコールバック
  onChange: (value: string) => void;
  // 採点済み・モーダル表示中等、入力を禁止したい場合にtrue
  disabled?: boolean;
};

/**
 * errata学習画面の回答入力欄コンポーネント
 *
 * 目的:
 * - ユーザーが正解と思う文字列を入力するためのテキストフィールドを提供
 * - 採点済み（回答確定後）は編集不可にし、判定結果との不整合を防ぐ
 */
export function AnswerInput({ value, onChange, disabled = false }: AnswerInputProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder="答えを入力してください"
      className="w-full max-w-xl px-4 py-3 rounded-xl border border-slate-300 text-base text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:bg-slate-100 disabled:text-slate-400"
    />
  );
}
