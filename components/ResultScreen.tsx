"use client";

import React from "react";
import Link from "next/link";
import { StudyType } from "@/types/score";

// ResultScreenコンポーネントのProps型定義
export type ResultScreenProps = {
  // 学習方式（表示ラベルの出し分けに使用）
  studyType: StudyType;
  // 正解数
  correctCount: number;
  // 出題数
  total: number;
  // 「もう一度挑戦する」ボタン押下時のハンドラ
  onRetry: () => void;
};

// 学習方式ごとの画面表示ラベル
const STUDY_TYPE_LABEL: Record<StudyType, string> = {
  word: "Word",
  errata: "Errata",
};

/**
 * word/errata共通の学習結果画面コンポーネント (MVP10)
 *
 * 目的:
 * - 最終問題まで回答しscoresへの保存が完了した学習セッションの結果（正解数・出題数・正解率）を表示する
 * - 「もう一度挑戦する」を押した場合のみ、呼び出し元（word/errataページ）が
 *   useCardSessionのhandleRetryを実行して新しいセッションを開始する
 *
 * 正解率はDBの値ではなく、渡されたcorrectCount/totalからその場で算出する
 */
export function ResultScreen({
  studyType,
  correctCount,
  total,
  onRetry,
}: ResultScreenProps) {
  const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  return (
    <div className="h-dvh overflow-hidden flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md text-center py-10 px-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <p className="text-sm font-semibold text-indigo-600 tracking-wide uppercase">
          {STUDY_TYPE_LABEL[studyType]}
        </p>
        <h1 className="text-2xl font-bold text-slate-800 mt-2">
          学習セッション完了
        </h1>

        <p className="text-lg text-slate-700 mt-6">
          {correctCount} / {total}問 正解
        </p>
        <p className="text-sm text-slate-500 mt-1">正解率：{accuracy}%</p>

        <button
          type="button"
          onClick={onRetry}
          className="mt-8 px-8 py-3 rounded-full font-semibold text-base whitespace-nowrap bg-slate-900 text-white hover:bg-slate-800 shadow-md shadow-slate-900/10 transition-all duration-200 active:scale-95 cursor-pointer"
        >
          もう一度挑戦する
        </button>

        <div className="flex items-center justify-center gap-4 mt-6 text-sm">
          <Link
            href="/mypage"
            className="text-indigo-600 hover:text-indigo-500 font-medium whitespace-nowrap"
          >
            マイページで履歴を見る
          </Link>
          <Link
            href="/"
            className="text-slate-400 hover:text-slate-600 font-medium whitespace-nowrap"
          >
            ホームへ戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
