'use client';

import React, { useEffect, useRef } from 'react';
import '@/styles/opening/opening.css';

export type OpeningAnimationProps = {
  // オープニング終了時（全演出終了 or スキップ）に一度だけ呼ばれるコールバック。
  // 自動再生・手動再生のどちらで使うかはこの呼び出し元（親コンポーネント）が決める。
  onFinish: () => void;
};

// .opening-layer のfadeOut（50s delay + 3s duration）が完了するタイミング。
// イントロ5秒 → ロゴ5秒（10秒でほぼ消える）→ クロール開始(8秒)から
// フェードアウトが始まる50秒まで流れる → 3秒でオープニング全体をフェードアウト、
// という構成（詳しくはstyles/opening/opening.cssのコメントを参照）。
// 演出の見た目自体は素のCSS @keyframes（styles/opening/opening.css）が担っており、
// これはReact側へ「終わったこと」を知らせるための一度きりのタイマーに過ぎない
// （毎フレームの位置・拡大率などをJSで計算・更新することはしていない）。
const OPENING_TOTAL_DURATION_MS = 53000;

/**
 * トップページのスターウォーズ風オープニング演出（イントロ文 → ロゴ → 3Dクロール）
 *
 * 既存PHP版 (src/index.php, src/css/SW_title.css) のCSS @keyframesアニメーションを
 * そのままNext.js版へ移植したコンポーネント。DOM構造・CSSクラスの対応関係は
 * styles/opening/opening.css 側のコメントを参照。
 *
 * このコンポーネントがJSで行っているのは以下の2点のみで、演出そのもの
 * （opacity・transform・背景色の時間変化）はすべてCSSの@keyframesが担っている。
 * - マウント時にスキップボタンへフォーカスする（キーボード・スクリーンリーダー対応）
 * - 23秒後、またはスキップ操作で、呼び出し元へ終了を通知する
 */
export function OpeningAnimation({ onFinish }: OpeningAnimationProps) {
  // onFinishが二重に呼ばれないようにするガード（タイマー満了とスキップクリックの両対応）
  const hasFinishedRef = useRef(false);
  const skipButtonRef = useRef<HTMLButtonElement>(null);

  const finish = () => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    onFinish();
  };

  useEffect(() => {
    // マウント時にスキップボタンへフォーカスし、キーボード・スクリーンリーダー
    // 利用者がすぐにスキップ操作へたどり着けるようにする
    skipButtonRef.current?.focus();

    // 23秒後に自動終了させるタイマー。
    // React Strict Modeの開発時二重実行（mount→cleanup→mount）が起きても、
    // クリーンアップで必ずclearTimeoutするため、タイマーが二重に走ることはない。
    const timer = setTimeout(finish, OPENING_TOTAL_DURATION_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="opening-layer"
      role="dialog"
      aria-modal="true"
      aria-label="オープニング演出"
    >
      {/* p#start */}
      <p className="opening-intro">
        このWebアプリはスターウォーズをオマージュして作成しています…
      </p>

      {/* #opening h1 */}
      <h1 className="opening-logo">
        START
        <br />
        WORDS
        <sub className="opening-logo-sub">単語帳アプリ</sub>
      </h1>

      {/* #titles */}
      <div className="opening-crawl" aria-hidden="true">
        {/* #titlecontent */}
        <div className="opening-crawl-track">
          <p className="opening-crawl-center">START</p>
          <p>通勤時間や昼休みに</p>
          <p>サクッと単語覚えに使える！</p>
          <p>ゲーム感覚で楽しく続けられる～</p>
          <p></p>
          <p>apple,orange, big, small, night, morning, believe, good</p>
          <p>～まもなく始まります～</p>
          <p> </p>
          <p>
            START WORDS START WORDS START WORDS START WORDS START WORDS START
            WORDS START WORDS
          </p>
        </div>
      </div>

      {/* button#skipBtn.skip */}
      <button
        ref={skipButtonRef}
        type="button"
        className="opening-skip"
        aria-label="オープニング演出をスキップしてホーム画面を表示する"
        onClick={finish}
      >
        スキップ
      </button>
    </div>
  );
}
