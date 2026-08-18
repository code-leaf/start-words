'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { OpeningAnimation } from '@/components/opening/OpeningAnimation';
import { useOpeningAutoplay } from '@/hooks/useOpeningAutoplay';

// ホームメニューの共通スタイル（既存ページのリンクボタン群と統一感を持たせる）
const menuItemClass =
  'flex-1 min-w-[140px] flex flex-col items-center justify-center text-center px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors cursor-pointer';

/**
 * ホーム画面のメニュー（単語帳・穴埋め・単語登録・演出を見る）と、
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
      <nav
        aria-label="メインメニュー"
        className="w-full flex flex-wrap gap-3 justify-center"
      >
        <Link href="/word" className={menuItemClass}>
          単語帳
          <br />
          フラッシュカード
        </Link>
        <Link href="/errata" className={menuItemClass}>
          穴埋め
          <br />
          フラッシュカード
        </Link>
        <Link href="/register" className={menuItemClass}>
          単語登録
        </Link>
        <button
          type="button"
          className={menuItemClass}
          onClick={() => setIsManualPlaying(true)}
        >
          演出を見る
        </button>
      </nav>

      {/* 自動再生: 初回アクセス時のみ表示され、終了時にsessionStorageへ視聴済みを記録する */}
      {shouldAutoPlay && <OpeningAnimation onFinish={markViewed} />}

      {/* 手動再生: 「演出を見る」ボタンから常に再生可能。終了時はページ遷移させず、
          オーバーレイを閉じてホームへ戻すだけで、sessionStorageには触れない */}
      {isManualPlaying && (
        <OpeningAnimation onFinish={() => setIsManualPlaying(false)} />
      )}
    </>
  );
}
