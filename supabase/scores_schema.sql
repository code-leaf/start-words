-- ====================================================================
-- MVP 10: scores テーブル & RLS (Row Level Security) 設定 SQL
-- ====================================================================
-- このSQLファイルを Supabase 管理画面の SQL Editor で実行してください。
-- schema.sql (cards テーブル) の後に実行することを想定しています。
-- ====================================================================

-- 1. scores テーブルの作成
-- 1回のWord/Errata学習セッション（最後まで回答した場合のみ）につき1レコードを保存する。
-- score・incorrect_count・accuracy は question_count/correct_count から算出可能なため、
-- 二重管理を避けるためカラムとしては持たない。
CREATE TABLE IF NOT EXISTS public.scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    study_type TEXT NOT NULL CHECK (study_type IN ('word', 'errata')),
    question_count INTEGER NOT NULL CHECK (question_count > 0),
    correct_count INTEGER NOT NULL CHECK (correct_count >= 0 AND correct_count <= question_count),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- テーブルコメント
COMMENT ON TABLE public.scores IS 'ユーザーごとの学習セッション結果（Word/Errata、最後まで回答した場合のみ1レコード保存）';
COMMENT ON COLUMN public.scores.id IS '主キー (UUID)';
COMMENT ON COLUMN public.scores.user_id IS '学習したユーザーID (auth.users.id を参照)';
COMMENT ON COLUMN public.scores.study_type IS '学習方式 (word または errata)';
COMMENT ON COLUMN public.scores.question_count IS '出題数（セッション内の総問題数）';
COMMENT ON COLUMN public.scores.correct_count IS '正解数（不正解数・正解率はここから算出する）';
COMMENT ON COLUMN public.scores.created_at IS 'セッション完了・保存日時';

-- 2. user_id のインデックス作成 (RLSクエリ・マイページ一覧取得の高速化)
CREATE INDEX IF NOT EXISTS scores_user_id_idx ON public.scores(user_id);

-- 3. Row Level Security (RLS) の有効化
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;

-- 既存ポリシーのクリーンアップ (再実行時のエラー防止)
DROP POLICY IF EXISTS "scores_select_policy" ON public.scores;
DROP POLICY IF EXISTS "scores_insert_policy" ON public.scores;

-- --------------------------------------------------------------------
-- 4. 個別の RLS ポリシー作成 (対象ロール: authenticated)
-- --------------------------------------------------------------------

-- SELECT ポリシー: ログインユーザー自身のscoresのみ取得を許可（マイページの履歴一覧用）
CREATE POLICY "scores_select_policy"
ON public.scores
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- INSERT ポリシー: 自分の user_id を持つscoresのみ登録を許可
-- （クライアントから他ユーザーのuser_idを指定してINSERTすることはRLSレベルで拒否される）
CREATE POLICY "scores_insert_policy"
ON public.scores
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE / DELETE ポリシーは意図的に作成しない
-- scoresは学習セッション完了時に1度だけINSERTされる不変の履歴レコードであり、
-- 編集・削除機能はMVP10のスコープ外のため、ポリシー未定義（＝RLSによりデフォルト拒否）のままとする。

-- --------------------------------------------------------------------
-- 5. authenticated ロールへのテーブルレベル権限付与
-- --------------------------------------------------------------------
-- RLSポリシーは「どの行にアクセスできるか」という行レベルの制御であり、
-- それとは別に「テーブルそのものへの操作権限」（GRANT）がPostgreSQL側で
-- 必要となる。cards/profilesは本プロジェクトの初期セットアップ時点で
-- authenticatedロールへのデフォルト権限が付与済みだったため明示的な
-- GRANTなしで動作していたが、本テーブルでは同様のデフォルト権限が
-- 付与されず "permission denied for table scores" が発生したため、
-- RLSポリシーと同じ範囲（SELECT / INSERTのみ、UPDATE / DELETEは付与しない）で
-- 明示的にGRANTする。
GRANT SELECT, INSERT ON public.scores TO authenticated;
