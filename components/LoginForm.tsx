'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { translateAuthError } from '@/lib/authErrors';

/**
 * ログインフォームコンポーネント (/login)
 *
 * 目的:
 * - メールアドレス・パスワードによるログインのみを担当する
 * - ログイン成功後は、公開用トップページ(/)へ遷移する（MVP12）
 *
 * 失敗時の方針:
 * - Supabaseの技術的なエラーメッセージをそのまま出さず、translateAuthErrorで日本語化する
 * - 失敗してもメールアドレス・パスワードの入力値は消さない（再入力の手間を減らすため）
 */
export function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    // 必須項目チェック（HTMLのrequiredに加え、念のためJS側でも空白のみを弾く）
    if (email.trim() === '' || password === '') {
      setFormError('メールアドレスとパスワードを入力してください。');
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setFormError(translateAuthError(error.message));
        return;
      }

      // ログイン成功後はホームページへ遷移する（MVP12）
      router.push('/');
      router.refresh();
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
          className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:bg-slate-100 disabled:text-slate-400"
        />
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
          className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:bg-slate-100 disabled:text-slate-400"
        />
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
        {isSubmitting ? 'ログイン中...' : 'ログイン'}
      </button>
    </form>
  );
}
