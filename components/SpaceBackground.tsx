import React from 'react';

/**
 * アプリ全体で共通の宇宙背景レイヤー
 *
 * 目的:
 * - ホーム・ログイン・ユーザー登録・単語登録・Word・Errata・マイページなど、
 *   通常ユーザーが利用する全ページで同一の宇宙背景を表示するための共通コンポーネント。
 * - app/layout.tsx に一箇所だけ配置し、各ページのUI（カード・フォーム等）とは
 *   完全に分離したレイヤーとして扱う。ページが増えてもこのコンポーネントを
 *   変更する必要はない。
 *
 * 背景画像について:
 * - GitHubリポジトリ内にPHP版由来の宇宙背景画像、または利用可能な既存の背景画像は
 *   存在しなかったため、画像を新規作成せずCSSのみ（グラデーション + 星）で
 *   宇宙背景を再現している（詳細は app/globals.css のコメントを参照）。
 * - 画像を追加したい場合は、globals.cssの `--space-bg-image` 変数にパスを
 *   設定するだけで、このレイヤーに合成される。
 *
 * オープニング演出との関係:
 * - components/opening/OpeningAnimation.tsx の `.opening-layer` は
 *   position:fixed; z-index:9999 の不透明な黒背景であるため、このレイヤーの
 *   上に常に正しく重なって表示される（このレイヤーのz-indexは-1）。
 */
export function SpaceBackground() {
  return (
    <div className="app-space-background" aria-hidden="true">
      <div className="app-space-background__image" />
      <div className="app-space-background__nebula" />
      <div className="app-space-background__stars" />
    </div>
  );
}
