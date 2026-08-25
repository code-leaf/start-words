-- ====================================================================
-- MVP 14: card_answers テーブル & RLS (Row Level Security) 設定 SQL
-- ====================================================================
-- このSQLファイルを Supabase 管理画面の SQL Editor で実行してください。
-- schema.sql (cards テーブル) の後に実行することを想定しています。
--
-- 目的:
-- 1カードにつき1つだった正解 (cards.back_text) を、1カード:N正解候補の
-- 構造 (card_answers) へ変更するための追加テーブルです。
-- cards.back_text カラムの削除は、データ移行・アプリケーション対応・動作確認が
-- すべて完了した後、別ファイル (card_answers_drop_back_text.sql) で行います。
-- ====================================================================

-- 1. card_answers テーブルの作成
CREATE TABLE IF NOT EXISTS public.card_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
    answer_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT card_answers_answer_text_not_empty
        CHECK (length(trim(answer_text)) > 0),

    -- 同一カード内での正解候補の重複登録を防止する (アプリ側もtrim済みの値をINSERTする)
    CONSTRAINT card_answers_card_id_answer_text_key
        UNIQUE (card_id, answer_text)
);

-- テーブルコメント
COMMENT ON TABLE public.card_answers IS 'カードごとの正解候補 (1カード:N正解候補、正本データ)';
COMMENT ON COLUMN public.card_answers.id IS '主キー (UUID)';
COMMENT ON COLUMN public.card_answers.card_id IS '紐づくカードID (cards.id を参照、カード削除時にCASCADE削除)';
COMMENT ON COLUMN public.card_answers.answer_text IS '正解候補テキスト (日本語訳など)';
COMMENT ON COLUMN public.card_answers.created_at IS '作成日時';
COMMENT ON COLUMN public.card_answers.updated_at IS '更新日時';

-- 2. card_id のインデックス作成 (カードごとの正解候補一覧取得の高速化)
-- UNIQUE制約 (card_id, answer_text) により複合インデックスは自動作成されるが、
-- card_idのみでの絞り込み (JOIN取得等) を高速化するため単独インデックスも作成する
CREATE INDEX IF NOT EXISTS card_answers_card_id_idx ON public.card_answers(card_id);

-- 3. Row Level Security (RLS) の有効化
ALTER TABLE public.card_answers ENABLE ROW LEVEL SECURITY;

-- 既存ポリシーのクリーンアップ (再実行時のエラー防止)
DROP POLICY IF EXISTS "card_answers_select_policy" ON public.card_answers;
DROP POLICY IF EXISTS "card_answers_insert_policy" ON public.card_answers;
DROP POLICY IF EXISTS "card_answers_update_policy" ON public.card_answers;
DROP POLICY IF EXISTS "card_answers_delete_policy" ON public.card_answers;

-- --------------------------------------------------------------------
-- 4. 個別の RLS ポリシー作成 (対象ロール: authenticated)
-- card_answers は user_id を保持しないため、card_id 経由で cards.user_id を参照し
-- auth.uid() と一致するかどうかで所有者を判定する
-- --------------------------------------------------------------------

-- SELECT ポリシー: 自分のカードに紐づく正解候補のみ取得を許可
CREATE POLICY "card_answers_select_policy"
ON public.card_answers
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.cards
        WHERE cards.id = card_answers.card_id
          AND cards.user_id = auth.uid()
    )
);

-- INSERT ポリシー: 自分のカードに対してのみ正解候補の登録を許可
CREATE POLICY "card_answers_insert_policy"
ON public.card_answers
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.cards
        WHERE cards.id = card_answers.card_id
          AND cards.user_id = auth.uid()
    )
);

-- UPDATE ポリシー: 自分のカードに紐づく正解候補のみ更新を許可
CREATE POLICY "card_answers_update_policy"
ON public.card_answers
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.cards
        WHERE cards.id = card_answers.card_id
          AND cards.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.cards
        WHERE cards.id = card_answers.card_id
          AND cards.user_id = auth.uid()
    )
);

-- DELETE ポリシー: 自分のカードに紐づく正解候補のみ削除を許可
CREATE POLICY "card_answers_delete_policy"
ON public.card_answers
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.cards
        WHERE cards.id = card_answers.card_id
          AND cards.user_id = auth.uid()
    )
);

-- --------------------------------------------------------------------
-- 5. authenticated ロールへのテーブルレベル権限付与
-- --------------------------------------------------------------------
-- RLSポリシーは「どの行にアクセスできるか」という行レベルの制御であり、
-- それとは別に「テーブルそのものへの操作権限」（GRANT）がPostgreSQL側で
-- 必要となる。scoresテーブル導入時 (MVP10) と同様、新規テーブルには
-- authenticatedロールへのデフォルト権限が付与されないため、明示的にGRANTする。
-- card_answersはアプリケーションからSELECT / INSERT / UPDATE / DELETEすべてを
-- 使用するため、cardsテーブルと同じ範囲でGRANTする。
GRANT SELECT, INSERT, UPDATE, DELETE ON public.card_answers TO authenticated;
