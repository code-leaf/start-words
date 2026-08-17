"use client";

import { useState, useCallback } from "react";

/**
 * errata回答入力欄の状態管理フック
 *
 * 目的:
 * - 回答入力値の保持・更新・リセットのみを担当する
 *
 * useCardSession と分離している理由:
 * - useCardSession はカード進行・スコア管理・反転制御など「セッション全体」の関心事を担う汎用フック。
 *   回答入力値という「errata固有のUI状態」をそこに混入させると、word学習など別モードでも
 *   不要な状態を抱え込む設計になってしまう。
 * - 関心事を分離することで useCardSession は変更不要のまま errata でも共有でき、
 *   将来さらに別の学習モードを追加する際もそれぞれのUIが独自の入力状態管理フックを持てばよい。
 */
export function useErrataAnswer() {
  // 回答入力欄の現在値
  const [inputValue, setInputValue] = useState<string>("");

  // 入力値を空文字へ戻す処理（次のカードへ進む際に呼び出す）
  const reset = useCallback(() => {
    setInputValue("");
  }, []);

  return { inputValue, setInputValue, reset };
}
