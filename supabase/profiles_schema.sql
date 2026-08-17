-- ====================================================================
-- MVP 7: profiles テーブル & RLS (Row Level Security) & 自動作成トリガー
-- ====================================================================
-- このSQLファイルを Supabase 管理画面の SQL Editor で実行してください。
-- schema.sql (cards テーブル) の後に実行することを想定しています。
-- ====================================================================

-- 1. profiles テーブルの作成
-- id は auth.users.id と1対1で対応させ、ユーザーが削除された場合は
-- プロフィールも連動して削除されるよう ON DELETE CASCADE を指定します。
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'ユーザープロフィール（ユーザー名）。auth.users と1対1で対応';
COMMENT ON COLUMN public.profiles.id IS '主キー。auth.users.id を参照するUUID';
COMMENT ON COLUMN public.profiles.username IS 'ユーザー登録時に入力したユーザー名';

-- 2. Row Level Security (RLS) の有効化
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 既存ポリシーのクリーンアップ (再実行時のエラー防止)
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;

-- --------------------------------------------------------------------
-- 3. 個別の RLS ポリシー作成 (対象ロール: authenticated)
-- --------------------------------------------------------------------

-- SELECT ポリシー: ログインユーザー自身のプロフィールのみ取得を許可
-- （ヘッダー等でのユーザー名表示に使用。他ユーザーのプロフィールは取得不可）
CREATE POLICY "profiles_select_policy"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- INSERT ポリシー: 自分のidを持つ行のみ登録を許可
-- 実際のINSERTは下記トリガー (SECURITY DEFINER) が行うため通常は使われませんが、
-- cardsテーブルと同様にRLSを多層防御として明示しておきます。
CREATE POLICY "profiles_insert_policy"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- --------------------------------------------------------------------
-- 4. 新規ユーザー作成時にprofilesへ自動で1行作成するトリガー
-- --------------------------------------------------------------------
-- なぜトリガーが必要か:
-- - クライアント側で signUp 直後に profiles へ INSERT しようとすると、
--   メール確認が有効な設定の場合はまだ認証セッションが確立しておらず、
--   auth.uid() が取得できないため RLS の INSERT ポリシーを満たせません。
-- - そこで auth.users への行追加をトリガーで検知し、DB側（SECURITY DEFINER）で
--   確実に profiles を作成することで、認証確認の有無に関わらず
--   auth.users.id と profiles.id が必ず1対1で対応するようにします。
-- - ユーザー名は signUp 時に options.data.username として渡された
--   raw_user_meta_data から取得します。
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data ->> 'username'), ''), '')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
