'use client';

import React, { useState } from 'react';
import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

interface AuthSessionControlProps {
  user: User | null;
  onSessionChange: () => void;
}

/**
 * MVP 1 検証用 最小限認証セッション制御コンポーネント (Requirement 8 & 9)
 * 
 * 目的:
 * - 本番用のログイン画面や会員登録画面は作成せず、MVP 1のRLS動作検証に必要な
 *   「テストユーザーの認証セッション」を手軽に確立・解除するための操作パネルです。
 * - ログイン中の場合、`auth.uid()` に設定されている UUID を確認できます。
 */
export function AuthSessionControl({ user, onSessionChange }: AuthSessionControlProps) {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const supabase = createBrowserClient();

  // サインイン (テストユーザー用)
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigningIn(true);
    setAuthError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setAuthError(`ログイン失敗: ${error.message}`);
      } else {
        onSessionChange();
      }
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'ログイン処理中にエラーが発生しました');
    } finally {
      setIsSigningIn(false);
    }
  };

  // サインアップ (新規テストユーザー作成 helper)
  const handleSignUp = async () => {
    setIsSigningIn(true);
    setAuthError(null);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setAuthError(`ユーザー作成失敗: ${error.message}`);
      } else {
        alert('テストユーザーの作成リクエストが成功しました。必要に応じてログインを行ってください。');
        onSessionChange();
      }
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'ユーザー作成中にエラーが発生しました');
    } finally {
      setIsSigningIn(false);
    }
  };

  // サインアウト
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    onSessionChange();
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-4 shadow-md">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
          <span>🔑</span> MVP 1 検証用 認証セッションステータス
        </h3>
        <span
          className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
            user
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          }`}
        >
          {user ? '認証済み (Authenticated)' : '未認証 (Unauthenticated)'}
        </span>
      </div>

      {user ? (
        /* ログイン中状態の表示 */
        <div className="space-y-3 pt-1">
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1 font-mono text-xs">
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Email:</span>
              <span className="font-semibold text-indigo-300">{user.email}</span>
            </div>
            <div className="flex justify-between text-slate-300 truncate">
              <span className="text-slate-400">User ID (auth.uid()):</span>
              <span className="font-semibold text-emerald-300 truncate">{user.id}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-slate-400">
              ※ この User ID が RLS ポリシー (`auth.uid() = cards.user_id`) で参照されます。
            </p>
            <button
              onClick={handleSignOut}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition border border-slate-700"
            >
              ログアウト
            </button>
          </div>
        </div>
      ) : (
        /* 未ログイン状態の表示・テスト用ログインフォーム */
        <form onSubmit={handleSignIn} className="space-y-3">
          <p className="text-xs text-slate-400">
            テストユーザーでログインして RLS 動作を確認します。アカウントがない場合は「テストユーザー作成」をクリックしてください。
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                placeholder="test@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {authError && (
            <div className="p-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg">
              {authError}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={isSigningIn}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition shadow-md shadow-indigo-600/20 disabled:opacity-50"
            >
              {isSigningIn ? 'ログイン中...' : 'テストユーザーでログイン'}
            </button>
            <button
              type="button"
              onClick={handleSignUp}
              disabled={isSigningIn}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition border border-slate-700 disabled:opacity-50"
            >
              新規テストユーザー作成
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
