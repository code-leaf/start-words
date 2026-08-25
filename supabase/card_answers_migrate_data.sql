-- ====================================================================
-- MVP 14: 既存 cards.back_text -> card_answers 移行 SQL
-- ====================================================================
-- card_answers_schema.sql の実行後、かつ cards.back_text カラムが
-- まだ存在する間 (削除前) に実行してください。
--
-- 進め方:
-- 1. まず下記「事前確認」のSELECTを実行し、異常データ (NULL・空文字・
--    trim後に空になるもの) が無いことを確認する。
--    異常データが見つかった場合は、勝手に削除・補正せず報告すること。
-- 2. 問題がなければ「移行本体」のINSERTを実行する。
-- 3. 「移行後確認」の3つのSELECTで、カード数と移行件数・内容が一致することを確認する。
-- ====================================================================

-- --------------------------------------------------------------------
-- 事前確認: back_textがNULL、空文字、またはtrim後に空になるカードの検出
-- 0件であることを確認してから次に進むこと
-- --------------------------------------------------------------------
SELECT id, user_id, front_text, back_text
FROM public.cards
WHERE back_text IS NULL
   OR length(trim(back_text)) = 0;

-- --------------------------------------------------------------------
-- 移行本体: 1カードにつき1件、trim済みのback_textをcard_answersへ移行する
-- ON CONFLICT DO NOTHING: 再実行時に同一内容のレコードを重複挿入しないための保険
-- --------------------------------------------------------------------
INSERT INTO public.card_answers (card_id, answer_text)
SELECT
    id,
    trim(back_text)
FROM public.cards
WHERE back_text IS NOT NULL
  AND length(trim(back_text)) > 0
ON CONFLICT (card_id, answer_text) DO NOTHING;

-- --------------------------------------------------------------------
-- 移行後確認1: カード数
-- --------------------------------------------------------------------
SELECT COUNT(*) AS card_count FROM public.cards;

-- --------------------------------------------------------------------
-- 移行後確認2: 移行された正解候補数 (原則カード数と一致するはず)
-- --------------------------------------------------------------------
SELECT COUNT(*) AS answer_count FROM public.card_answers;

-- --------------------------------------------------------------------
-- 移行後確認3: カードごとの旧back_textと新answer_textの突き合わせ
-- --------------------------------------------------------------------
SELECT
    c.id,
    c.front_text,
    c.back_text,
    ca.answer_text
FROM public.cards c
LEFT JOIN public.card_answers ca ON ca.card_id = c.id
ORDER BY c.created_at;
