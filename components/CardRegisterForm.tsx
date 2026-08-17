"use client";

import React from "react";
import { useCardRegister } from "@/hooks/useCardRegister";

/**
 * 単語登録画面（/register）の入力フォームコンポーネント
 *
 * 目的:
 * - 「表」「裏」の入力欄と登録ボタンのUIを提供する
 * - 入力値の状態管理・バリデーション・登録処理そのものはuseCardRegisterに委譲し、
 *   このコンポーネントはUIの組み立てと表示のみを担当する
 */
export function CardRegisterForm() {
  const {
    frontText,
    setFrontText,
    backText,
    setBackText,
    frontError,
    backError,
    submitError,
    isSubmitting,
    register,
  } = useCardRegister();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    // ブラウザ標準のフォーム送信（ページ遷移）を止め、register()による登録処理に委ねる
    e.preventDefault();
    register();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-8 flex flex-col gap-5"
    >
      {/* DBエラー等、フォーム全体に関わるエラーの表示。入力値は消さずそのまま残す */}
      {submitError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center">
          {submitError}
        </div>
      )}

      {/* 表（front_text）入力欄 */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="front_text" className="text-sm font-semibold text-slate-700">
          表
        </label>
        <input
          id="front_text"
          type="text"
          value={frontText}
          onChange={(e) => setFrontText(e.target.value)}
          disabled={isSubmitting}
          placeholder="apple"
          className={`w-full px-4 py-3 rounded-xl border text-base text-slate-800 shadow-sm focus:outline-none focus:ring-2 disabled:bg-slate-100 disabled:text-slate-400 ${
            frontError
              ? "border-red-300 focus:ring-red-300"
              : "border-slate-300 focus:ring-slate-400"
          }`}
        />
        {frontError && (
          <p className="text-xs text-red-600">{frontError}</p>
        )}
      </div>

      {/* 裏（back_text）入力欄 */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="back_text" className="text-sm font-semibold text-slate-700">
          裏
        </label>
        <input
          id="back_text"
          type="text"
          value={backText}
          onChange={(e) => setBackText(e.target.value)}
          disabled={isSubmitting}
          placeholder="りんご"
          className={`w-full px-4 py-3 rounded-xl border text-base text-slate-800 shadow-sm focus:outline-none focus:ring-2 disabled:bg-slate-100 disabled:text-slate-400 ${
            backError
              ? "border-red-300 focus:ring-red-300"
              : "border-slate-300 focus:ring-slate-400"
          }`}
        />
        {backError && (
          <p className="text-xs text-red-600">{backError}</p>
        )}
      </div>

      {/* 登録ボタン（タップしやすいよう縦の余白を広めに確保） */}
      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full py-3.5 rounded-full font-semibold text-base shadow-md transition-all duration-200 select-none active:scale-95 ${
          isSubmitting
            ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none active:scale-100"
            : "bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/10 cursor-pointer"
        }`}
      >
        {isSubmitting ? "登録中..." : "カードを登録"}
      </button>
    </form>
  );
}
