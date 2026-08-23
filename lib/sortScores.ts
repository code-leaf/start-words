import { Score, SortOption } from '@/types/score';

/**
 * マイページの学習履歴の並び替えを担当するモジュールです (MVP13)
 *
 * DB側のソート条件（lib/scores.ts の fetchUserScores は created_at 降順で取得）は
 * 変更せず、取得済みのscoresをこの中でのみ並び替える。
 */

/**
 * 正解率をcorrect_count/question_countからその場で算出する（DBの値は保存・参照しない）
 * マイページの表示ロジック（旧 app/mypage/page.tsx）と同じ算出方法。
 */
export function calcAccuracy(score: Score): number {
  return score.question_count > 0
    ? Math.round((score.correct_count / score.question_count) * 100)
    : 0;
}

const byCreatedAtDesc = (a: Score, b: Score): number =>
  new Date(b.created_at).getTime() - new Date(a.created_at).getTime();

/**
 * scoresをsortOptionに従って並び替えた新しい配列を返す。
 * created_at以外を主キーとするソートは、同値の場合に created_at の新しい順を
 * 第2ソートキーとする。
 */
export function sortScores(scores: Score[], sortOption: SortOption): Score[] {
  const sorted = [...scores];

  switch (sortOption) {
    case 'newest':
      return sorted.sort(byCreatedAtDesc);
    case 'oldest':
      return sorted.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    case 'accuracyDesc':
      return sorted.sort(
        (a, b) => calcAccuracy(b) - calcAccuracy(a) || byCreatedAtDesc(a, b)
      );
    case 'accuracyAsc':
      return sorted.sort(
        (a, b) => calcAccuracy(a) - calcAccuracy(b) || byCreatedAtDesc(a, b)
      );
    case 'questionCountDesc':
      return sorted.sort(
        (a, b) => b.question_count - a.question_count || byCreatedAtDesc(a, b)
      );
    case 'questionCountAsc':
      return sorted.sort(
        (a, b) => a.question_count - b.question_count || byCreatedAtDesc(a, b)
      );
    default:
      return sorted;
  }
}
