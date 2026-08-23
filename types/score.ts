/**
 * スコア (scores) テーブルの型定義
 *
 * Supabaseの PostgreSQL `scores` テーブルに対応するTypeScript型です。
 * 1回のWord/Errata学習セッション（最後まで回答した場合のみ）につき1レコードに対応します。
 *
 * score・incorrect_count・accuracy はDBに保存せず、常に
 * question_count/correct_count から算出します（二重管理の回避）。
 */

/** 学習方式（word: 単語学習 / errata: 穴埋め学習） */
export type StudyType = "word" | "errata";

export interface Score {
  /** スコアのユニークID (UUID) */
  id: string;
  /** 学習したユーザーのID (auth.users.id を参照するUUID) */
  user_id: string;
  /** 学習方式 */
  study_type: StudyType;
  /** 出題数（セッション内の総問題数） */
  question_count: number;
  /** 正解数 */
  correct_count: number;
  /** セッション完了・保存日時 (ISO 8601 タイムスタンプ文字列) */
  created_at: string;
}

/** 新規スコア登録時に必要なデータの型 (id, created_at はDBで自動生成) */
export type InsertScore = {
  id?: string;
  user_id: string;
  study_type: StudyType;
  question_count: number;
  correct_count: number;
  created_at?: string;
};

/** スコア更新時に指定可能なデータの型（MVP10時点では更新機能は未実装） */
export type UpdateScore = {
  id?: string;
  user_id?: string;
  study_type?: StudyType;
  question_count?: number;
  correct_count?: number;
  created_at?: string;
};

/**
 * マイページの学習履歴ソート条件 (MVP13)
 *
 * いずれの条件も、主要な比較値が同値の場合は created_at の新しい順を
 * 第2ソートキーとする（lib/sortScores.ts の sortScores を参照）。
 */
export type SortOption =
  | "newest"
  | "oldest"
  | "accuracyDesc"
  | "accuracyAsc"
  | "questionCountDesc"
  | "questionCountAsc";
