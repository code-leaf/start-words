# Supabase Setup Guide for MVP 1

MVP 1 の動作確認に必要な Supabase のセットアップ手順です。

## 1. Supabase プロジェクトの準備
1. [Supabase Dashboard](https://database.new) で新しいプロジェクトを作成（または既存プロジェクトを選択）します。
2. **Project Settings > API** から以下を取得します:
   - `Project URL` -> `NEXT_PUBLIC_SUPABASE_URL`
   - `anon / public key` または `publishable key` -> `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

## 2. `.env.local` の作成
プロジェクトルートに `.env.local` を作成し、以下を設定します。

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOi...
```

## 3. データベーステーブル & RLS ポリシーの作成
1. Supabase Dashboard の **SQL Editor** を開きます。
2. `supabase/schema.sql` の内容をコピー＆ペーストして実行（Run）します。
3. `cards` テーブル、インデックス `cards_user_id_idx`、および 4つの個別 RLS ポリシー（SELECT / INSERT / UPDATE / DELETE）が作成されたことを確認します。

## 4. テストユーザーの作成
1. Supabase Dashboard の **Authentication > Users** を開きます。
2. **Add user > Create user** をクリックし、テストユーザーを作成します:
   - Email: `test@example.com` （または任意のテストメール）
   - Password: 任意のパスワード
3. 作成されたユーザーの **User UID** (UUID) をコピーします。

## 5. テストデータの投入
MVP 14 以降、正解候補は `card_answers` テーブルで管理します。
`supabase/seed.sql` の内容をコピーし、`'YOUR_TEST_USER_UUID'`（`401c4ffb-59fc-421e-8460-41b7d480372e`）を
作成したテストユーザーの UUID に置き換えて Supabase SQL Editor で実行してください
（`card_answers_schema.sql` の実行後に使用してください）。

または、Webアプリ画面の「検証用テストログイン」からテストユーザーでログイン後、画面上の「テスト用カードを追加」ボタンをクリックしても登録できます。

## 6. MVP 7: profiles テーブル & 自動作成トリガーの作成
1. Supabase Dashboard の **SQL Editor** を開きます。
2. `supabase/profiles_schema.sql` の内容をコピー＆ペーストして実行（Run）します。
3. `profiles` テーブル、RLSポリシー（SELECT / INSERT）、および `auth.users` への新規登録時に
   `profiles` を自動作成するトリガー `on_auth_user_created` が作成されたことを確認します。
4. `/signup` からユーザー登録すると、`auth.users` と1対1で対応する `profiles` 行
   （`id`, `username`, `created_at`）が自動的に作成されます。

## 7. MVP 10: scores テーブル & RLS の作成
1. Supabase Dashboard の **SQL Editor** を開きます。
2. `supabase/scores_schema.sql` の内容をコピー＆ペーストして実行（Run）します。
3. `scores` テーブル、インデックス `scores_user_id_idx`、2つの個別 RLS ポリシー
   （SELECT / INSERT）、および `authenticated` ロールへの `GRANT SELECT, INSERT`
   が作成されたことを確認します。UPDATE / DELETE の権限・ポリシーは
   意図的に付与しないため、アプリケーション・SQL Editorのどちらからも更新・削除はできません。
4. Word / Errataで学習を最後まで終えると、ログイン中ユーザーの `user_id` で
   `scores` 行（`study_type`, `question_count`, `correct_count`, `created_at`）が1件保存され、
   `/mypage` で自分の学習履歴のみを確認できます。

## 8. MVP 14: card_answers テーブル (単語の複数正解候補対応)
1カード1正解 (`cards.back_text`) を、1カード:N正解候補の構造へ変更します。
以下の順序で **必ず** 実行してください。順序を守らないとアプリが壊れます。

1. Supabase Dashboard の **SQL Editor** で `supabase/card_answers_schema.sql` を実行します。
   `card_answers` テーブル、インデックス `card_answers_card_id_idx`、4つの個別 RLS ポリシー
   （SELECT / INSERT / UPDATE / DELETE）、および `authenticated` ロールへの
   `GRANT SELECT, INSERT, UPDATE, DELETE` が作成されたことを確認します。
2. `supabase/card_answers_migrate_data.sql` を実行し、既存カードの `back_text` を
   `card_answers.answer_text` へ1カード1件として移行します。実行前に含まれる
   事前確認クエリで異常データ（NULL・空文字）が無いことを必ず確認してください。
3. `supabase/card_answers_relax_back_text_notnull.sql` を実行し、
   `cards.back_text` の `NOT NULL` 制約を解除します（カラム自体はまだ削除しません）。
   アプリケーションはcard_answers対応後、cards登録時にback_textを一切指定しないため、
   このステップを飛ばすと新規カード登録が `NOT NULL制約違反` で失敗します。
4. アプリケーションを `card_answers` 対応版へデプロイし、Word / Errata / 登録画面が
   正常に動作することを確認します。
5. すべて確認できたら、最後に `supabase/card_answers_drop_back_text.sql` を実行し、
   `cards.back_text` カラムを削除します（このファイルの冒頭に前提条件を明記しています）。

`supabase/seed.sql` は MVP 14 以降、`cards` + `card_answers` の構造でテストデータを投入します。
