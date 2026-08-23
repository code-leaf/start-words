'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export type AuthToggleProps = {
  // 現在どちらの画面を表示しているか（選択状態の表示に使用）
  active: 'login' | 'signup';
};

// 選択中/未選択で共通のセグメントスタイル
const segmentBaseClass =
  'px-3 py-1.5 sm:px-4 sm:py-1.5 rounded-full font-semibold whitespace-nowrap transition-colors';

/**
 * ログイン画面⇄ユーザー登録画面の切り替えUI（セグメント型トグル、MVP12）
 *
 * 目的:
 * - 「ログイン」「ユーザー登録」を常に2つ並べて表示し、現在どちらの画面に
 *   いるか（選択状態）と、押すとどちらへ切り替わるかを、文言だけでなく
 *   見た目（背景・文字色のコントラスト）でも一目で分かるようにする。
 * - 以前の実装（AuthSwitchLink）は「切り替え先」1つだけを
 *   「〇〇はこちら →」というリンクで示していたが、現在地が視覚的に
 *   分からない・押下可能なボタンなのか判別しづらいという問題があったため、
 *   2択を常に並べるセグメント型コントロールへ置き換えている。
 *
 * 配置について（position: fixed, 右上）:
 * - 通常ユーザー向けページ全体で右上に表示されるAuthStatusBadge
 *   （app/layout.tsx）と同じ「右上固定」の慣習に合わせている。
 * - /login, /signup では、未ログイン時のAuthStatusBadge
 *   （ログイン/ユーザー登録リンク）をこのコンポーネントに置き換えるため、
 *   AuthStatusBadge側でこの2ページのみ非表示にしており、右上のUI同士が
 *   重複・重なることはない（詳細はAuthStatusBadge.tsxのコメントを参照）。
 *
 * 選択中の項目について:
 * - 現在地のセグメントはLinkにせず、非活性のspanとして描画する。
 *   同じページへの不要な再遷移操作自体が発生しないようにするため。
 *
 * ログイン中に/login, /signupへ来た場合について:
 * - このコンポーネント自体は「未ログイン時の切り替えUI」のため、
 *   万一ログイン済みの状態でこの2ページへ来た場合は何も表示しない
 *   （その場合はAuthStatusBadge側の「ログアウト」表示が右上に出るため、
 *   同じ位置に2つのUIが重ならないようにするため）。
 */
export function AuthToggle({ active }: AuthToggleProps) {
  const { user, isLoading } = useAuth();

  if (isLoading || user) {
    return null;
  }

  return (
    <div
      className="fixed top-2 right-2 sm:top-3 sm:right-3 z-50 inline-flex items-center gap-0.5 p-1 bg-white/95 backdrop-blur border border-slate-200 rounded-full shadow-md text-xs sm:text-sm"
      role="tablist"
      aria-label="ログイン・ユーザー登録の切り替え"
    >
      {active === 'login' ? (
        <span
          className={`${segmentBaseClass} bg-slate-800 text-white shadow-sm`}
          role="tab"
          aria-selected="true"
        >
          ログイン
        </span>
      ) : (
        <Link
          href="/login"
          className={`${segmentBaseClass} text-slate-500 hover:text-slate-800 hover:bg-slate-100`}
          role="tab"
          aria-selected="false"
        >
          ログイン
        </Link>
      )}

      {active === 'signup' ? (
        <span
          className={`${segmentBaseClass} bg-slate-800 text-white shadow-sm`}
          role="tab"
          aria-selected="true"
        >
          ユーザー登録
        </span>
      ) : (
        <Link
          href="/signup"
          className={`${segmentBaseClass} text-slate-500 hover:text-slate-800 hover:bg-slate-100`}
          role="tab"
          aria-selected="false"
        >
          ユーザー登録
        </Link>
      )}
    </div>
  );
}
