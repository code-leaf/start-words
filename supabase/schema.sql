-- ====================================================================
-- MVP 1: cards テーブル & RLS (Row Level Security) 設定 SQL
-- ====================================================================
-- このSQLファイルを Supabase 管理画面の SQL Editor で実行してください。
-- ====================================================================

-- 1. cards テーブルの作成
CREATE TABLE IF NOT EXISTS public.cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    front_text TEXT NOT NULL,
    back_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- テーブルコメント
COMMENT ON TABLE public.cards IS 'ユーザーごとの学習フラッシュカード';
COMMENT ON COLUMN public.cards.id IS '主キー (UUID)';
COMMENT ON COLUMN public.cards.user_id IS '所有者のユーザーID (auth.users.id を参照)';
COMMENT ON COLUMN public.cards.front_text IS '表面テキスト (英語など)';
COMMENT ON COLUMN public.cards.back_text IS '裏面テキスト (日本語訳など)';

-- 2. user_id のインデックス作成 (RLSクエリの高速化)
CREATE INDEX IF NOT EXISTS cards_user_id_idx ON public.cards(user_id);

-- 3. Row Level Security (RLS) の有効化
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

-- 既存ポリシーのクリーンアップ (再実行時のエラー防止)
DROP POLICY IF EXISTS "cards_select_policy" ON public.cards;
DROP POLICY IF EXISTS "cards_insert_policy" ON public.cards;
DROP POLICY IF EXISTS "cards_update_policy" ON public.cards;
DROP POLICY IF EXISTS "cards_delete_policy" ON public.cards;

-- --------------------------------------------------------------------
-- 4. 個別の RLS ポリシー作成 (対象ロール: authenticated)
-- --------------------------------------------------------------------

-- SELECT ポリシー: ログインユーザー自身のカードのみ取得を許可
CREATE POLICY "cards_select_policy"
ON public.cards
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- INSERT ポリシー: 自分の user_id を持つカードのみ登録を許可
CREATE POLICY "cards_insert_policy"
ON public.cards
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE ポリシー: 自分のカードのみ更新を許可 (更新前・更新後の両方でチェック)
CREATE POLICY "cards_update_policy"
ON public.cards
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE ポリシー: 自分のカードのみ削除を許可
CREATE POLICY "cards_delete_policy"
ON public.cards
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
