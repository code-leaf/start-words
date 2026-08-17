'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { translateAuthError } from '@/lib/authErrors';

/**
 * ユーザー登録フォームコンポーネント (/signup)
 *
 * 目的:
 * - メールアドレス・パスワード・ユーザー名の3項目のみでユーザー登録を行う
 * - ユーザー名は options.data.username としてSupabase Authのユーザーメタデータへ渡す。
 *   実際の profiles 行の作成は、DB側のトリガー (handle_new_user) が
 *   auth.users への登録を検知して自動的に行うため、ここから直接
 *   profilesテーブルへINSERTすることはしない。
 *
 * メール確認設定への対応:
 * - Supabaseプロジェクトの設定次第で、signUp直後にセッションが確立する場合と、
 *   メール確認が完了するまでセッションが確立しない場合がある。
 * - 返却された session の有無で分岐し、確立していればそのまま/registerへ、
 *   確立していなければ「確認メールをご確認ください」という案内を表示する。
 */
export function SignUpForm() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setInfoMessage(null);

    // 前後の空白を除去した値で入力チェック・登録を行う（空白のみの入力は未入力扱い）
    const trimmedEmail = email.trim();
    const trimmedUsername = username.trim();

    const nextEmailError = trimmedEmail === '' ? 'メールアドレスを入力してください' : null;
    const nextPasswordError = password === '' ? 'パスワードを入力してください' : null;
    const nextUsernameError = trimmedUsername === '' ? 'ユーザー名を入力してください' : null;

    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    setUsernameError(nextUsernameError);

    if (nextEmailError || nextPasswordError || nextUsernameError) {
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createBrowserClient();
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          // profiles作成トリガーがここからusernameを読み取る
          data: { username: trimmedUsername },
        },
      });

      if (error) {
        setFormError(translateAuthError(error.message));
        return;
      }

      if (data.session) {
        // メール確認不要な設定の場合、登録直後にログイン済み状態となる
        router.push('/register');
        router.refresh();
        return;
      }

      // メール確認が必要な設定の場合はセッションが確立しないため、案内を表示する
      setInfoMessage(
        '確認メールを送信しました。メール内のリンクから登録を完了してください。'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-8 flex flex-col gap-5"
    >
      {formError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center">
          {formError}
        </div>
      )}

      {infoMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm text-center">
          {infoMessage}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-semibold text-slate-700">
          メールアドレス
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSubmitting}
          placeholder="you@example.com"
          className={`w-full px-4 py-3 rounded-xl border text-base text-slate-800 shadow-sm focus:outline-none focus:ring-2 disabled:bg-slate-100 disabled:text-slate-400 ${
            emailError ? 'border-red-300 focus:ring-red-300' : 'border-slate-300 focus:ring-slate-400'
          }`}
        />
        {emailError && <p className="text-xs text-red-600">{emailError}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-semibold text-slate-700">
          パスワード
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isSubmitting}
          placeholder="••••••••"
          className={`w-full px-4 py-3 rounded-xl border text-base text-slate-800 shadow-sm focus:outline-none focus:ring-2 disabled:bg-slate-100 disabled:text-slate-400 ${
            passwordError ? 'border-red-300 focus:ring-red-300' : 'border-slate-300 focus:ring-slate-400'
          }`}
        />
        {passwordError && <p className="text-xs text-red-600">{passwordError}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="username" className="text-sm font-semibold text-slate-700">
          ユーザー名
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={isSubmitting}
          placeholder="たなか"
          className={`w-full px-4 py-3 rounded-xl border text-base text-slate-800 shadow-sm focus:outline-none focus:ring-2 disabled:bg-slate-100 disabled:text-slate-400 ${
            usernameError ? 'border-red-300 focus:ring-red-300' : 'border-slate-300 focus:ring-slate-400'
          }`}
        />
        {usernameError && <p className="text-xs text-red-600">{usernameError}</p>}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full py-3.5 rounded-full font-semibold text-base shadow-md transition-all duration-200 select-none active:scale-95 ${
          isSubmitting
            ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none active:scale-100'
            : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/10 cursor-pointer'
        }`}
      >
        {isSubmitting ? '登録中...' : '登録'}
      </button>
    </form>
  );
}
