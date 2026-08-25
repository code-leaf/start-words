-- ====================================================================
-- MVP 14: cards.back_text の NOT NULL 制約を一時的に解除する SQL
-- ====================================================================
-- 【実機確認で発見された登録エラーの原因と対処】
-- アプリケーションはMVP14でcard_answers対応へ変更済みのため、cardsへの
-- INSERT時にback_textを一切指定しない構造になっている。
-- 一方、cards.back_textはMVP1作成時点のスキーマのままNOT NULL制約が
-- 残っているため、back_textを指定しない新規カード登録がPostgreSQLの
-- NOT NULL制約違反で失敗していた（カード登録エラー発生箇所:
-- lib/cards.ts insertCardWithAnswers 内、cards.insertの結果）。
--
-- back_textカラム自体は、既存データ移行・アプリ実装・実機確認が
-- すべて完了するまで削除しない方針のため、ここではNOT NULL制約のみを
-- 解除し、カラムは残す。正本データはcard_answersのままであり、
-- back_textへ複数回答を書き戻す・カンマ区切りやJSON等で保存する、
-- といった対応は行わない。
--
-- card_answers_schema.sql / card_answers_migrate_data.sql の実行後、
-- かつアプリケーションのcard_answers対応版をデプロイする前に実行してください。
-- ====================================================================

ALTER TABLE public.cards
ALTER COLUMN back_text DROP NOT NULL;

COMMENT ON COLUMN public.cards.back_text IS
  '[MVP14移行中・非推奨] 正解データの正本は card_answers。card_answers_drop_back_text.sql で削除予定のため、新規行では値を設定しない。';
