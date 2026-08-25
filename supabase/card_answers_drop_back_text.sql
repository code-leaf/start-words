-- ====================================================================
-- MVP 14: cards.back_text カラム削除 SQL (最終ステップ)
-- ====================================================================
-- 必ず以下がすべて完了してから実行してください:
--   1. card_answers_schema.sql の実行 (テーブル作成・RLS・GRANT)
--   2. card_answers_migrate_data.sql によるデータ移行・確認
--   3. アプリケーションのcard_answers対応への変更・デプロイ
--   4. back_textへの依存がアプリケーションコードに残っていないことの確認
--        grep -R "back_text" app components hooks lib types supabase
--   5. Word / Errata / 登録画面等の動作確認
--
-- 上記が未完了の状態でこのSQLを実行すると、アプリケーションが参照している
-- カラムが失われ、既存機能が壊れます。
-- ====================================================================

ALTER TABLE public.cards
DROP COLUMN IF EXISTS back_text;

COMMENT ON TABLE public.cards IS 'ユーザーごとの学習フラッシュカード（正解候補は card_answers に1:Nで保持する）';
