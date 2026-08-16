"use client";

import React from "react";

// BB-8トグルのプロパティ型定義
export type BB8ToggleProps = {
  // トグルのチェック状態（trueでカード裏面へ反転）
  checked: boolean;
  // チェック状態が変化した際のイベントハンドラ
  onChange: (checked: boolean) => void;
  // トグル背景の画像バリエーション
  bgVariant?: 1 | 2;
  // トグルの無効化フラグ（モーダル表示中などの誤操作防止用）
  disabled?: boolean;
};

// 背景画像パスの管理定義（バリアント番号に対応する画像パス）
const backgrounds: Record<number, string> = {
  1: "/img/bg_toggle01.svg",
  2: "/img/bg_toggle02.svg",
};

/**
 * BB-8キャラクターのアニメーショントグルスイッチ
 * 
 * 目的:
 * - ユーザー操作によりカードの表面/裏面を切り替える反転トリガーを提供
 * - 操作時にBB-8の頭部や胴体が回転・移動するアニメーション演出を実行
 * - disabled時は操作を無効化し、モーダル表示中の誤操作を防止
 */
export function BB8Toggle({
  checked,
  onChange,
  bgVariant = 1,
  disabled = false,
}: BB8ToggleProps) {
  // 指定されたバリアント番号から対応する背景画像URLを取得（未指定時はデフォルト1）
  const bg = backgrounds[bgVariant] ?? backgrounds[1];

  return (
    <label
      className={`bb8-toggle ${disabled ? "opacity-50 pointer-events-none cursor-not-allowed" : ""}`}
      aria-label="カード反転トグル"
      aria-disabled={disabled}
    >
      {/* 状態保持用の非表示チェックボックス */}
      <input
        className="bb8-toggle-checkbox"
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => {
          if (!disabled) {
            onChange(e.target.checked);
          }
        }}
      />

      {/* BB-8トグルの外枠コンテナ（背景画像を表示） */}
      <div
        className="bb8-toggle-container"
        style={{ backgroundImage: `url('${bg}')` }}
      >
        <div className="bb8-toggle-scenery" />

        {/* BB-8キャラクター本体 */}
        <div className="bb8">
          {/* 頭部エリア（アンテナ・目・ヘルメット） */}
          <div className="bb8-head-container">
            <div className="bb8-antenna" />
            <div className="bb8-antenna" />
            <div className="bb8-head" />
          </div>

          {/* 胴体エリア（回転する球体） */}
          <div className="bb8-body" />
        </div>

        {/* トグル枠内に収めるための影エフェクト */}
        <div className="artificial-hidden">
          <div className="bb8-shadow" />
        </div>
      </div>
    </label>
  );
}
