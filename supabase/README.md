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
Supabase SQL Editor で、コピーした User UID を指定して以下の SQL を実行します:

```sql
INSERT INTO public.cards (user_id, front_text, back_text)
VALUES
    ('あなたのUSER_UID', 'apple', 'りんご'),
    ('あなたのUSER_UID', 'book', '本'),
    ('あなたのUSER_UID', 'study', '勉強する');
```

または、Webアプリ画面の「検証用テストログイン」からテストユーザーでログイン後、画面上の「テスト用カードを追加」ボタンをクリックしても登録できます。

## 6. MVP 7: profiles テーブル & 自動作成トリガーの作成
1. Supabase Dashboard の **SQL Editor** を開きます。
2. `supabase/profiles_schema.sql` の内容をコピー＆ペーストして実行（Run）します。
3. `profiles` テーブル、RLSポリシー（SELECT / INSERT）、および `auth.users` への新規登録時に
   `profiles` を自動作成するトリガー `on_auth_user_created` が作成されたことを確認します。
4. `/signup` からユーザー登録すると、`auth.users` と1対1で対応する `profiles` 行
   （`id`, `username`, `created_at`）が自動的に作成されます。
