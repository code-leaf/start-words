'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { OpeningAnimation } from '@/components/opening/OpeningAnimation';
import { useOpeningAutoplay } from '@/hooks/useOpeningAutoplay';
import { useModal } from '@/contexts/ModalContext';

// ホームメニューの共通スタイル（既存ページのリンクボタン群と統一感を持たせる）
const menuItemClass =
  'flex flex-col items-center justify-center text-center px-4 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm sm:text-base transition-colors cursor-pointer shadow-lg shadow-indigo-950/40';

// 「単語帳」「フラッシュカード」等、途中で改行してはいけない短いラベル用のスタイル
const menuLabelClass = 'whitespace-nowrap';

// オープニング演出の進行フェーズ (MVP15)
// - idle          : 何も表示していない（ホーム画面のみ）
// - choosing       : BGM確認モーダルを表示し、ユーザーの選択を待っている
// - playing-audio  : 音声ありでOpeningAnimationを再生中
// - playing-silent : 音声なしでOpeningAnimationを再生中
type OpeningPhase = 'idle' | 'choosing' | 'playing-audio' | 'playing-silent';

/**
 * ホーム画面のメニュー（単語帳・穴埋め・単語登録・マイページ・オープニング演出を観る）と、
 * オープニング演出の自動再生・手動再生・BGM確認モーダルをまとめて扱うコンポーネント
 *
 * MVP15での変更点（BGM対応）:
 * - 従来は「自動再生」「手動再生」それぞれが直接OpeningAnimationを表示していたが、
 *   MVP15ではどちらの起点でも先に共通モーダル基盤（ModalContext/Modal/modalContents）
 *   経由でBGM確認モーダル（openingAudioChoice）を表示し、ユーザーが
 *   「🔊 音声ありで再生」「🔇 音なしで再生」「スキップ」のいずれかを選んでから
 *   OpeningAnimationを開始する（またはスキップして開始しない）流れに変更した。
 * - 自動再生・手動再生の分岐は「OpeningPhaseへ遷移するきっかけが何か」だけの違いで、
 *   モーダル表示以降のロジック（requestOpeningPlayback）は完全に共通化している
 *   （モーダルUIを二重実装しない、という要件を満たすための設計）。
 *
 * 自動再生と手動再生でOpeningAnimation自体を二重実装しないための設計:
 * - 演出のUI・タイミングはOpeningAnimation側に一本化されている。
 * - ここでは「いつ表示するか」「音声あり/なしどちらで表示するか」の状態管理だけを
 *   OpeningPhaseとして一元管理する。
 *   自動再生: useOpeningAutoplay（sessionStorageで初回判定・視聴済み保存）
 *   手動再生: 「オープニング演出を観る」ボタン
 *   どちらも同じrequestOpeningPlayback()を呼び出す。
 */
export function OpeningLauncher() {
  const { shouldAutoPlay, markViewed } = useOpeningAutoplay();
  const { openModal } = useModal();
  const [phase, setPhase] = useState<OpeningPhase>('idle');

  // 現在のphaseをrefでも保持し、requestOpeningPlayback内の同期的なガード判定に使う。
  // setState(updaterFn)のupdater内でopenModal等の副作用を呼ぶ実装は、React Strict Mode
  // が純粋性検証のためupdaterを2回呼び出すことがあり、モーダルが二重に開いてしまう
  // 事故につながるため避け、代わりに副作用を伴わないrefで同期判定する。
  const phaseRef = useRef<OpeningPhase>('idle');
  const updatePhase = useCallback((next: OpeningPhase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  // 自動再生の起動は「shouldAutoPlayがtrueになった最初の1回だけ」に限定するためのガード。
  // Reactの状態(state)ではなくrefを使うのは、React Strict Modeの開発時二重実行
  // （effectがmount→cleanup→mountの順で2回走る）が起きても、ref自体はその間
  // リセットされないため、2回目のeffect実行時に正しく「もう起動済み」と
  // 判定でき、BGM確認モーダルが二重に開いてしまう事故を防げるため。
  const hasAutoTriggeredRef = useRef(false);

  // BGM確認モーダルを表示し、ユーザーの選択に応じて後続の状態遷移を行う。
  // 自動再生・手動再生のどちらからも、この関数を呼ぶだけでよい（モーダルUIの二重実装を避ける）。
  const requestOpeningPlayback = useCallback(() => {
    // 既に選択中/再生中の場合は何もしない（自動再生と手動再生がほぼ同時に
    // 発火した場合等の二重起動防止）
    if (phaseRef.current !== 'idle') return;

    updatePhase('choosing');

    openModal('openingAudioChoice', undefined, (actionKey) => {
      if (actionKey === 'audioOn') {
        updatePhase('playing-audio');
      } else if (actionKey === 'audioOff') {
        updatePhase('playing-silent');
      } else {
        // 'skip': 演出を開始せず、視聴済みとして記録してホーム画面のままにする
        markViewed();
        updatePhase('idle');
      }
    });
  }, [openModal, markViewed, updatePhase]);

  // 初回アクセス時の自動再生: shouldAutoPlayがtrueになったタイミングで
  // 一度だけBGM確認モーダルを起動する
  useEffect(() => {
    if (shouldAutoPlay && !hasAutoTriggeredRef.current) {
      hasAutoTriggeredRef.current = true;
      requestOpeningPlayback();
    }
  }, [shouldAutoPlay, requestOpeningPlayback]);

  // OpeningAnimation終了時（通常終了・演出内スキップの両方）の共通処理。
  // 視聴済みとして記録し、フェーズをidleへ戻してホーム画面表示に戻す。
  const handleAnimationFinish = useCallback(() => {
    markViewed();
    updatePhase('idle');
  }, [markViewed, updatePhase]);

  return (
    <>
      {/*
        グリッドレイアウトについて（ブラウザバック時のレイアウト崩れ対策 & 文字折り返し対策）:
        flex-wrap + min-widthによる折り返しは、コンテナ幅がわずかに変化する
        （スクロールバーの有無、フォント読み込みタイミングの違い等）だけで
        折り返し方が変わってしまい不安定だった。grid-cols-*のように列数を
        整数で固定することで、コンテナ幅が多少変動しても常に同じ折り返しを
        維持でき、初回表示・ブラウザバック/フォワード・リロードのどの経路でも
        同一のレイアウトになる。

        スマートフォン幅（sm未満）ではgrid-cols-1（1列・各ボタン全幅）にしている。
        2列のままだと、320px〜414px幅では1ボタンあたりの実質幅が「フラッシュ
        カード」（8文字）を1行に収めるには足りず、文字の途中で改行されてしまう
        （320px幅で実測: 2列時は1ボタンあたり約106px、フラッシュカードの表示
        には約112px以上必要で不足していた）。1列にすることで1ボタンあたりの
        幅が大きく広がり、320px幅でも「フラッシュカード」が1行に収まる。
        sm以上（640px〜）では横幅に十分余裕があるため2列に戻す。
        各ラベル文字列（menuLabelClass = whitespace-nowrap）にも念のため
        nowrapを指定し、どんな幅でも単語の途中で改行されないことを保証している。
      */}
      <nav
        aria-label="メインメニュー"
        className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3"
      >
        <Link href="/word" className={menuItemClass}>
          <span className={menuLabelClass}>単語帳</span>
          <span className={menuLabelClass}>フラッシュカード</span>
        </Link>
        <Link href="/errata" className={menuItemClass}>
          <span className={menuLabelClass}>穴埋め</span>
          <span className={menuLabelClass}>フラッシュカード</span>
        </Link>
        <Link href="/register" className={menuItemClass}>
          <span className={menuLabelClass}>単語登録</span>
        </Link>
        <Link href="/mypage" className={menuItemClass}>
          <span className={menuLabelClass}>マイページ</span>
        </Link>
        <button
          type="button"
          className={`${menuItemClass} sm:col-span-2`}
          onClick={requestOpeningPlayback}
        >
          <span className={menuLabelClass}>オープニング演出を観る</span>
        </button>
      </nav>

      {/* 音声ありで再生中: BGM確認モーダルで「🔊 音声ありで再生」が選ばれた場合 */}
      {phase === 'playing-audio' && (
        <OpeningAnimation audioEnabled onFinish={handleAnimationFinish} />
      )}

      {/* 音声なしで再生中: BGM確認モーダルで「🔇 音なしで再生」が選ばれた場合 */}
      {phase === 'playing-silent' && (
        <OpeningAnimation audioEnabled={false} onFinish={handleAnimationFinish} />
      )}
    </>
  );
}
