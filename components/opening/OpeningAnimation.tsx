'use client';

import React, { useEffect, useRef } from 'react';
import '@/styles/opening/opening.css';

export type OpeningAnimationProps = {
  // オープニング終了時（23秒経過 or スキップ）に一度だけ呼ばれるコールバック。
  // 自動再生・手動再生のどちらで使うかはこの呼び出し元（親コンポーネント）が決める。
  onFinish: () => void;
};

// 既存PHP版のタイミング仕様（変更禁止）をミリ秒で表した定数群
const INTRO_HOLD_END_MS = 4500; // イントロ文: 90%地点までは不透明を維持
const INTRO_FADE_END_MS = 5000; // イントロ文: 5秒でフェードアウト完了

const LOGO_START_MS = 5000; // ロゴ: 5秒delay
const LOGO_OPACITY_HOLD_END_MS = 7500; // ロゴ: 50%地点まではopacity維持
const LOGO_END_MS = 10000; // ロゴ: delay+durationで10秒時点に消失

const CRAWL_START_MS = 4000; // 3Dクロール: 4秒後から開始
const CRAWL_SCROLL_DURATION_MS = 100000; // 3Dクロール: 100秒かけてtop:100%→-170%

const BG_FADE_END_MS = 3000; // body背景: 黒→白へ3秒
const OPENING_FADE_START_MS = 20000; // オープニング全体: 20秒delay
const OPENING_TOTAL_DURATION_MS = 23000; // オープニング全体: 23秒で終了

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

/**
 * トップページのスターウォーズ風オープニング演出（イントロ文 → ロゴ → 3Dクロール）
 *
 * 実装方式について（CSS @keyframes ではなく requestAnimationFrame を採用した理由）:
 * - 当初はCSSの@keyframes + animation-delayで各演出のタイミングを組んでいたが、
 *   OS側の「視差効果を減らす」設定（prefers-reduced-motion: reduce）が有効な環境で、
 *   明示的にprefers-reduced-motionを分岐させていないイントロ文の@keyframesアニメーションまで
 *   ブラウザ側で止まってしまい、演出全体が「固まって見える」不具合が実機で確認された。
 * - これはブラウザ・OSの実装依存の挙動であり、CSSの@keyframesに頼る限り確実な制御が難しい。
 *   そこで、経過時間から各要素のopacity/transform/背景色を毎フレーム計算し、
 *   ref経由で直接styleへ反映するrequestAnimationFrameベースの実装に切り替えた。
 *   これは「CSSアニメーション」ではなく単なるスタイルの直接更新であるため、
 *   ブラウザ・OS側のアニメーション抑制機能の影響を受けず、常に意図通り進行する。
 * - 3Dクロールの傾き（perspective/rotateX）のみ、prefers-reduced-motionが有効な場合に
 *   CSS側でシンプルな表示へ切り替える。スクロール自体（進行）は止めない。
 *   完全に静止させると「壊れている」ように見えてしまうため、大きな3D的動きだけを削減する。
 * - 終了判定（23秒）はこのループ自身が経過時間で行うため、CSSの設定に一切依存しない。
 */
export function OpeningAnimation({ onFinish }: OpeningAnimationProps) {
  // onFinishが二重に呼ばれないようにするガード
  const hasFinishedRef = useRef(false);
  const skipButtonRef = useRef<HTMLButtonElement>(null);

  const layerRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLParagraphElement>(null);
  const logoRef = useRef<HTMLHeadingElement>(null);
  const crawlTrackRef = useRef<HTMLDivElement>(null);

  const finish = () => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    onFinish();
  };

  useEffect(() => {
    // マウント時にスキップボタンへフォーカスし、キーボード・スクリーンリーダー
    // 利用者がすぐにスキップ操作へたどり着けるようにする
    skipButtonRef.current?.focus();

    let rafId: number;
    let startTime: number | null = null;

    const tick = (now: number) => {
      if (startTime === null) startTime = now;
      const elapsed = now - startTime;

      // 背景色: 黒 → 白（0〜3秒）
      if (layerRef.current) {
        const bgT = clamp01(elapsed / BG_FADE_END_MS);
        const c = Math.round(lerp(0, 255, bgT));
        layerRef.current.style.backgroundColor = `rgb(${c}, ${c}, ${c})`;

        // オープニング全体のフェードアウト（20〜23秒）
        const fadeT = clamp01(
          (elapsed - OPENING_FADE_START_MS) /
            (OPENING_TOTAL_DURATION_MS - OPENING_FADE_START_MS)
        );
        layerRef.current.style.opacity = String(1 - fadeT);
      }

      // イントロ文: 0〜90%(4.5秒)は表示、そこから5秒地点でフェードアウト完了
      if (introRef.current) {
        const op =
          elapsed <= INTRO_HOLD_END_MS
            ? 1
            : 1 -
              clamp01(
                (elapsed - INTRO_HOLD_END_MS) /
                  (INTRO_FADE_END_MS - INTRO_HOLD_END_MS)
              );
        introRef.current.style.opacity = String(op);
      }

      // START WORDSロゴ: 5秒delay、5秒かけてscale(1)→scale(0.1)、
      // opacityは後半（50%地点以降）のみフェードアウト
      if (logoRef.current) {
        if (elapsed < LOGO_START_MS) {
          logoRef.current.style.opacity = '0';
        } else {
          const t = clamp01(
            (elapsed - LOGO_START_MS) / (LOGO_END_MS - LOGO_START_MS)
          );
          const scale = lerp(1, 0.1, t);
          const op =
            elapsed <= LOGO_OPACITY_HOLD_END_MS
              ? 1
              : 1 -
                clamp01(
                  (elapsed - LOGO_OPACITY_HOLD_END_MS) /
                    (LOGO_END_MS - LOGO_OPACITY_HOLD_END_MS)
                );
          logoRef.current.style.opacity = String(op);
          logoRef.current.style.transform = `translate(-50%, -50%) scale(${scale})`;
        }
      }

      // 3Dクロール: 4秒後からtop:100%→-170%へ100秒かけて移動
      if (crawlTrackRef.current) {
        const t = clamp01(
          (elapsed - CRAWL_START_MS) / CRAWL_SCROLL_DURATION_MS
        );
        crawlTrackRef.current.style.top = `${lerp(100, -170, t)}%`;
      }

      if (elapsed >= OPENING_TOTAL_DURATION_MS) {
        finish();
        return;
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={layerRef}
      className="opening-layer"
      role="dialog"
      aria-modal="true"
      aria-label="オープニング演出"
    >
      <p ref={introRef} className="opening-intro">
        このWebアプリはスターウォーズをオマージュして作成しています…
      </p>

      <h1 ref={logoRef} className="opening-logo">
        START
        <br />
        WORDS
        <span className="opening-logo-sub">単語帳アプリ</span>
      </h1>

      <div className="opening-crawl" aria-hidden="true">
        <div ref={crawlTrackRef} className="opening-crawl-track">
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
