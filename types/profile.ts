/**
 * プロフィール (profiles) テーブルの型定義
 *
 * Supabaseの PostgreSQL `profiles` テーブルに対応するTypeScript型です。
 * `id` は `auth.users.id` と1対1で対応し、ユーザー登録時にDBトリガーが
 * 自動的に1行作成します（アプリ側から直接INSERTすることはありません）。
 */

export interface Profile {
  /** ユーザーID (auth.users.id を参照するUUID) */
  id: string;
  /** 登録時に入力されたユーザー名 */
  username: string;
  /** プロフィール作成日時 (ISO 8601 タイムスタンプ文字列) */
  created_at: string;
}

/**
 * profiles行の新規作成時に必要なデータの型
 *
 * 実際のINSERTはSupabase側のDBトリガー (handle_new_user) が行うため、
 * アプリケーションコードから直接この型でINSERTを発行することはありません。
 * Database型定義を成立させるために定義しています。
 */
export type InsertProfile = {
  id: string;
  username: string;
  created_at?: string;
};

/** profiles更新時に指定可能なデータの型（MVP7時点ではプロフィール編集機能は未実装） */
export type UpdateProfile = {
  username?: string;
};
