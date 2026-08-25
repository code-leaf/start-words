/**
 * カード (cards) テーブルの型定義
 *
 * Supabaseの PostgreSQL `cards` テーブルに対応するTypeScript型です。
 * アプリケーション全体で型安全にカードデータを扱うために使用します。
 *
 * MVP14での変更点:
 * - 1カード1正解だった `back_text` を廃止し、1カード:N正解候補の
 *   `card_answers` テーブルへ分離した。`Card.answers` は学習画面等で
 *   カードと正解候補一覧をまとめて扱うための結合済みデータ構造。
 *
 * なお、Supabaseクライアントに渡す `Database` 型はアプリ全体で1つに統一する必要があるため、
 * profiles テーブルの型（types/profile.ts）もこのファイル内でDatabase型へ合成しています。
 */

import { Profile, InsertProfile, UpdateProfile } from "./profile";
import { Score, InsertScore, UpdateScore } from "./score";

/** カードの正解候補 (card_answers) テーブルの型定義 */
export interface CardAnswer {
  /** 正解候補のユニークID (UUID) */
  id: string;
  /** 紐づくカードのID (cards.id を参照するUUID) */
  card_id: string;
  /** 正解候補テキスト (日本語訳など) */
  answer_text: string;
  /** 作成日時 (ISO 8601 タイムスタンプ文字列) */
  created_at: string;
  /** 更新日時 (ISO 8601 タイムスタンプ文字列) */
  updated_at: string;
}

/** 新規正解候補登録時に必要なデータの型 (id, created_at, updated_at はDBで自動生成) */
export type InsertCardAnswer = {
  id?: string;
  card_id: string;
  answer_text: string;
  created_at?: string;
  updated_at?: string;
};

/** 正解候補更新時に指定可能なデータの型 */
export type UpdateCardAnswer = {
  id?: string;
  card_id?: string;
  answer_text?: string;
  updated_at?: string;
};

export interface Card {
  /** カードのユニークID (UUID) */
  id: string;
  /** 所有者ユーザーのID (auth.users.id を参照するUUID) */
  user_id: string;
  /** 表面テキスト (単語・問題など) */
  front_text: string;
  /** 作成日時 (ISO 8601 タイムスタンプ文字列) */
  created_at: string;
  /** 更新日時 (ISO 8601 タイムスタンプ文字列) */
  updated_at: string;
  /** このカードに紐づく正解候補一覧 (card_answersとの結合結果、最低1件) */
  answers: CardAnswer[];
}

/** 新規カード登録時に必要なデータの型 (id, created_at, updated_at はDBで自動生成) */
export type InsertCard = {
  id?: string;
  user_id: string;
  front_text: string;
  created_at?: string;
  updated_at?: string;
};

/** カード更新時に指定可能なデータの型 */
export type UpdateCard = {
  id?: string;
  user_id?: string;
  front_text?: string;
  created_at?: string;
  updated_at?: string;
};

/** Supabase Generic Schema 準拠 データベース型定義 */
export type Database = {
  public: {
    Tables: {
      cards: {
        Row: Omit<Card, "answers">;
        Insert: InsertCard;
        Update: UpdateCard;
        Relationships: [
          {
            foreignKeyName: "cards_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      card_answers: {
        Row: CardAnswer;
        Insert: InsertCardAnswer;
        Update: UpdateCardAnswer;
        Relationships: [
          {
            foreignKeyName: "card_answers_card_id_fkey";
            columns: ["card_id"];
            isOneToOne: false;
            referencedRelation: "cards";
            referencedColumns: ["id"];
          }
        ];
      };
      profiles: {
        Row: Profile;
        Insert: InsertProfile;
        Update: UpdateProfile;
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      scores: {
        Row: Score;
        Insert: InsertScore;
        Update: UpdateScore;
        Relationships: [
          {
            foreignKeyName: "scores_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
