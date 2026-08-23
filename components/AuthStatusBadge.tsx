'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

// /login, /signup では専用のAuthToggle（セグメント型切り替えUI）が
// 右上に表示されるため、未ログイン時のこのバッジ（ログイン/ユーザー登録リンク）は
// 同じ右上に重複表示されないよう、この2ページでのみ非表示にする。
const AUTH_TOGGLE_PAGES = ['/login', '/signup'];

/**
 * 画面右上に常時浮かぶ、認証状態表示コンポーネント
 *
 * 目的:
 * - 未ログイン時:「ログイン」「ユーザー登録」への導線を表示
 * - ログイン時: ユーザー名（未取得時はメールアドレス）と「ログアウト」ボタンを表示
 *
 * 配置方針（position: fixed）について:
 * - /word, /errata は h-dvh + overflow-hidden で画面ぴったりに設計されたレイアウトのため、
 *   通常のフロー内にヘッダーを追加すると高さ計算がずれてレイアウトが崩れてしまう。
 * - fixedで画面に重ねて表示することで、既存の学習画面のレイアウト・高さ計算に
 *   一切手を加えずに、全画面共通で認証状態を表示できるようにしている。
 *
 * モバイル幅での表示について:
 * - /word, /errata はヘッダー（タイトル）が画面最上部ぎりぎりに配置されるため、
 *   375px程度の狭い画面ではメールアドレス／ユーザー名の文字列がタイトルと重なってしまう。
 * - sm未満（モバイル幅）ではユーザー名／メールアドレスの表示を省略し、
 *   「ログアウト」ボタンのみを表示することでバッジ自体を小さくし、重なりを防ぐ。
 *   ユーザー名はsm以上の画面幅でのみ表示する。
 *
 * /login, /signup での非表示について（MVP12追加）:
 * - この2ページには、現在地と切り替え先が視覚的に分かる専用のAuthToggle
 *   （components/AuthToggle.tsx）が右上に表示される。未ログイン時のこの
 *   バッジも「ログイン」「ユーザー登録」リンクを右上に表示するため、
 *   両方を出すと同じ位置にUIが重複してしまう。そのため未ログイン状態で
 *   この2ページを表示している間だけ、このバッジ自体を出さない
 *   （ログイン中にこの2ページへ来た場合は、ログアウト操作のため通常通り表示する）。
 */
export function AuthStatusBadge() {
  const { user, profile, isLoading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSigningOut, setIsSigningOut] = useState(false);

  // 初回のセッション確認中は表示を出さない（未ログイン状態のちらつき防止）
  if (isLoading) {
    return null;
  }

  // /login, /signup は専用のAuthToggleが右上の役割を担うため、未ログイン時は重複表示しない
  if (!user && AUTH_TOGGLE_PAGES.includes(pathname)) {
    return null;
  }

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      // ログアウト後、保護ページに留まらないようログイン画面へ遷移させる
      router.push('/login');
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="fixed top-2 right-2 sm:top-3 sm:right-3 z-50 flex items-center gap-2 px-2 py-1.5 sm:px-3 sm:py-2 bg-white/95 backdrop-blur border border-slate-200 rounded-full shadow-md text-xs sm:text-sm whitespace-nowrap">
      {user ? (
        <>
          <span className="hidden sm:inline font-semibold text-slate-700 max-w-[8rem] sm:max-w-[12rem] truncate">
            {profile?.username || user.email}
          </span>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="px-2.5 py-1 rounded-full bg-slate-800 text-white font-semibold hover:bg-slate-700 disabled:opacity-50 cursor-pointer"
          >
            {isSigningOut ? '...' : 'ログアウト'}
          </button>
        </>
      ) : (
        <>
          <Link
            href="/login"
            className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200"
          >
            ログイン
          </Link>
          <Link
            href="/signup"
            className="px-2.5 py-1 rounded-full bg-slate-800 text-white font-semibold hover:bg-slate-700"
          >
            ユーザー登録
          </Link>
        </>
      )}
    </div>
  );
}
