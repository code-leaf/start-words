"use client";

import React from "react";
import Link from "next/link";
import { Card } from "@/types/card";
import { useCardEdit } from "@/hooks/useCardEdit";
import { CardAnswerFields } from "@/components/CardAnswerFields";

/**
 * 単語編集画面（/mypage/cards/[id]/edit）の入力フォームコンポーネント (MVP14)
 *
 * CardRegisterFormとの違い:
 * - 既存カード（表・正解候補）の値で初期化された状態から編集する
 * - 送信ボタンは「更新する」、加えて一覧へ戻る「キャンセル」導線を持つ
 * - 状態管理・更新処理はuseCardEditに委譲し、このコンポーネントはUIの組み立てのみを担当する
 */
export function CardEditForm({ card }: { card: Card }) {
  const {
    frontText,
    setFrontText,
    answerTexts,
    updateAnswerText,
    addAnswerField,
    removeAnswerField,
    frontError,
    answerErrors,
    submitError,
    isSubmitting,
    save,
  } = useCardEdit(card);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    // ブラウザ標準のフォーム送信（ページ遷移）を止め、save()による更新処理に委ねる
    e.preventDefault();
    save();
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

      {/* 裏（正解候補）入力欄リスト */}
      <CardAnswerFields
        answerTexts={answerTexts}
        answerErrors={answerErrors}
        onChange={updateAnswerText}
        onAdd={addAnswerField}
        onRemove={removeAnswerField}
        disabled={isSubmitting}
      />

      {/* キャンセル・更新ボタン */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <Link
          href="/mypage"
          aria-disabled={isSubmitting}
          className={`w-full py-3.5 rounded-full font-semibold text-base text-center border border-slate-300 text-slate-600 transition-colors ${
            isSubmitting
              ? "opacity-50 pointer-events-none"
              : "hover:bg-slate-50 cursor-pointer"
          }`}
        >
          キャンセル
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-3.5 rounded-full font-semibold text-base shadow-md transition-all duration-200 select-none active:scale-95 ${
            isSubmitting
              ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none active:scale-100"
              : "bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/10 cursor-pointer"
          }`}
        >
          {isSubmitting ? "更新中..." : "更新する"}
        </button>
      </div>
    </form>
  );
}
