"use client";

import React from "react";

export type CardAnswerFieldsProps = {
  // 正解候補の入力値一覧
  answerTexts: string[];
  // 各候補のインラインバリデーションエラー（answerTextsとインデックスで対応）
  answerErrors: (string | null)[];
  // 指定インデックスの入力値変更時のコールバック
  onChange: (index: number, value: string) => void;
  // 「＋ 正解候補を追加」押下時のコールバック
  onAdd: () => void;
  // 指定インデックスの削除ボタン押下時のコールバック
  onRemove: (index: number) => void;
  // 送信中等、入力・追加・削除を禁止したい場合にtrue
  disabled?: boolean;
};

/**
 * 「裏（正解候補）」の複数入力欄UI（単語登録・単語編集の両画面で共用、MVP14）
 *
 * 目的:
 * - CardRegisterForm・CardEditFormで見た目・操作を完全に一致させるため、
 *   正解候補リストの表示・追加・削除UIをこのコンポーネントへ集約する
 * - 状態管理・バリデーションは呼び出し側のフック（useCardRegister/useCardEdit）が持ち、
 *   このコンポーネントは受け取ったpropsの表示とイベント通知のみを担当する
 *
 * MVP14追加修正（入力モード最適化）:
 * - 正解候補は日本語を入力する欄のため、各入力欄にlang="ja"を指定する。
 *   本コンポーネントはCardEditFormとも共用のため、この変更は単語編集画面の
 *   正解候補入力欄にも同様に適用される（バリデーション・保存等のロジックは無変更）。
 */
export function CardAnswerFields({
  answerTexts,
  answerErrors,
  onChange,
  onAdd,
  onRemove,
  disabled = false,
}: CardAnswerFieldsProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-slate-700">
        裏（正解候補）
      </label>
      <div className="flex flex-col gap-2">
        {answerTexts.map((answerText, index) => (
          <div key={index} className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <input
                type="text"
                lang="ja"
                value={answerText}
                onChange={(e) => onChange(index, e.target.value)}
                disabled={disabled}
                placeholder="りんご"
                className={`w-full min-w-0 px-4 py-3 rounded-xl border text-base text-slate-800 shadow-sm focus:outline-none focus:ring-2 disabled:bg-slate-100 disabled:text-slate-400 ${
                  answerErrors[index]
                    ? "border-red-300 focus:ring-red-300"
                    : "border-slate-300 focus:ring-slate-400"
                }`}
              />
              {answerTexts.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  disabled={disabled}
                  className="shrink-0 px-3 py-2.5 rounded-lg text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  削除
                </button>
              )}
            </div>
            {answerErrors[index] && (
              <p className="text-xs text-red-600">{answerErrors[index]}</p>
            )}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onAdd}
        disabled={disabled}
        className="self-start mt-1 text-sm font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        ＋ 正解候補を追加
      </button>
    </div>
  );
}
