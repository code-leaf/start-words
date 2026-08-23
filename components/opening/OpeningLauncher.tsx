'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { OpeningAnimation } from '@/components/opening/OpeningAnimation';
import { useOpeningAutoplay } from '@/hooks/useOpeningAutoplay';

// ホームメニューの共通スタイル（既存ページのリンクボタン群と統一感を持たせる）
const menuItemClass =
  'flex flex-col items-center justify-center text-center px-4 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm sm:text-base transition-colors cursor-pointer shadow-lg shadow-indigo-950/40';

// 「単語帳」「フラッシュカード」等、途中で改行してはいけない短いラベル用のスタイル
const menuLabelClass = 'whitespace-nowrap';

/**
 * ホーム画面のメニュー（単語帳・穴埋め・単語登録・マイページ・オープニング演出を観る）と、
 * オープニング演出の自動再生・手動再生をまとめて扱うコンポーネント
 *
 * 自動再生と手動再生でOpeningAnimation自体を二重実装しないための設計:
 * - 演出のUI・タイミングはOpeningAnimation側に一本化されている。
 * - ここでは「いつ表示するか」の状態管理だけを目的別に分離して持つ。
 *   自動再生: useOpeningAutoplay（sessionStorageで初回判定・視聴済み保存）
 *   手動再生: isManualPlaying（ローカルstateのみ。sessionStorageは一切参照・変更しない）
 */
export function OpeningLauncher() {
  const { shouldAutoPlay, markViewed } = useOpeningAutoplay();
  const [isManualPlaying, setIsManualPlaying] = useState(false);

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
          onClick={() => setIsManualPlaying(true)}
        >
          <span className={menuLabelClass}>オープニング演出を観る</span>
        </button>
      </nav>

      {/* 自動再生: 初回アクセス時のみ表示され、終了時にsessionStorageへ視聴済みを記録する */}
      {shouldAutoPlay && <OpeningAnimation onFinish={markViewed} />}

      {/* 手動再生: 「オープニング演出を観る」ボタンから常に再生可能。終了時はページ遷移させず、
          オーバーレイを閉じてホームへ戻すだけで、sessionStorageには触れない */}
      {isManualPlaying && (
        <OpeningAnimation onFinish={() => setIsManualPlaying(false)} />
      )}
    </>
  );
}
