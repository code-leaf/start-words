'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { User } from '@supabase/supabase-js';
import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { fetchCurrentProfile } from '@/lib/profiles';
import { Profile } from '@/types/profile';

// AuthContextが提供する値の型定義
export type AuthContextType = {
  // 現在ログイン中のSupabase Authユーザー（未ログイン時はnull）
  user: User | null;
  // 現在ログイン中ユーザーのプロフィール（未取得・未ログイン時はnull）
  profile: Profile | null;
  // 初回のセッション確認が完了しているかどうか
  isLoading: boolean;
  // ログアウト処理
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * アプリケーション全体に「現在ログイン中かどうか」の状態を提供するプロバイダー
 *
 * 目的:
 * - ヘッダー等の認証状態表示UI（AuthStatusBadge）や、今後認証状態を参照したい
 *   画面から、どこでも同じログイン状態・プロフィール情報を参照できるようにする
 * - MVP1Dashboardが独自に行っていた「getUser + onAuthStateChangeの購読」という
 *   セッション監視パターンを踏襲しつつ、アプリ全体で共有できる形に一本化する
 *
 * 認証必須ページ（/word, /errata, /register）のアクセス制御そのものは
 * 直接URLアクセスにも効くミドルウェア（lib/supabase/middleware.ts）側で行っており、
 * このContextは「画面上に現在の認証状態を表示するため」の補助的な状態管理を担う。
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // レンダーのたびにクライアントが再生成されないよう、エフェクト内で1度だけ生成する
    const supabase = createBrowserClient();

    // ログイン中ユーザーのプロフィールを取得し、状態へ反映する
    const loadProfile = async (currentUser: User | null) => {
      if (!currentUser) {
        setProfile(null);
        return;
      }
      const { profile: fetchedProfile } = await fetchCurrentProfile(supabase);
      setProfile(fetchedProfile);
    };

    // 初回マウント時に現在の認証状態を確認
    const initialize = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      setUser(currentUser);
      await loadProfile(currentUser);
      setIsLoading(false);
    };

    initialize();

    // ログイン・ログアウト・トークン更新等のセッション変化を監視し、状態を同期する
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      loadProfile(nextUser);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    // onAuthStateChangeの購読により user/profile は自動的にnullへ更新される
  }, []);

  const value = useMemo(
    () => ({ user, profile, isLoading, signOut }),
    [user, profile, isLoading, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * 認証状態参照用カスタムフック
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
