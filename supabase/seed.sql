-- ====================================================================
-- MVP 14: テストデータ投入 SQL サンプル (cards + card_answers)
-- ====================================================================
-- 注意: `'YOUR_TEST_USER_UUID'` 部分を、作成したテストユーザーの UUID に
-- 置き換えて Supabase SQL Editor で実行してください。
-- card_answers_schema.sql の実行後に使用してください。
-- ====================================================================

-- テストユーザー (user_id) に紐付くテストカードを追加し (表のみ)、
-- 続けて各カードの正解候補をcard_answersへ登録する (appleは複数候補の例)
WITH new_cards AS (
    INSERT INTO public.cards (user_id, front_text)
    VALUES
        ('401c4ffb-59fc-421e-8460-41b7d480372e', 'apple'),
        ('401c4ffb-59fc-421e-8460-41b7d480372e', 'book'),
        ('401c4ffb-59fc-421e-8460-41b7d480372e', 'study')
    RETURNING id, front_text
)
INSERT INTO public.card_answers (card_id, answer_text)
SELECT new_cards.id, answers.answer_text
FROM new_cards
JOIN (
    VALUES
        ('apple', '林檎'),
        ('apple', 'りんご'),
        ('apple', 'リンゴ'),
        ('book', '本'),
        ('study', '勉強する')
) AS answers(front_text, answer_text)
ON answers.front_text = new_cards.front_text;
