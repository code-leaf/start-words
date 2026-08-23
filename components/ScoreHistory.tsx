'use client';

import { useMemo, useState } from 'react';
import { Score, SortOption, StudyType } from '@/types/score';
import { calcAccuracy, sortScores } from '@/lib/sortScores';

// 学習方式ごとの画面表示ラベル（ResultScreenと共通の対応表）
const STUDY_TYPE_LABEL: Record<StudyType, string> = {
  word: 'Word',
  errata: 'Errata',
};

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: '新しい順' },
  { value: 'oldest', label: '古い順' },
  { value: 'accuracyDesc', label: '正解率が高い順' },
  { value: 'accuracyAsc', label: '正解率が低い順' },
  { value: 'questionCountDesc', label: '問題数が多い順' },
  { value: 'questionCountAsc', label: '問題数が少ない順' },
];

// スコアの学習日時（created_at）を日本語ロケールの表示形式へ変換する
function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * マイページの学習履歴一覧（ソートUI + 履歴リスト） (MVP13)
 *
 * Server Component (app/mypage/page.tsx) が取得済みのscoresを受け取り、
 * このコンポーネント内でのみ並び替えて表示する。DBへの再取得は行わない。
 * セレクトボックスの選択状態管理のためにClient Componentとしている。
 */
export function ScoreHistory({ scores }: { scores: Score[] }) {
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const sortedScores = useMemo(
    () => sortScores(scores, sortOption),
    [scores, sortOption]
  );

  if (scores.length === 0) {
    return (
      <div className="w-full text-center py-16 px-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <p className="text-lg font-medium text-slate-700">
          まだ学習履歴がありません
        </p>
        <p className="text-sm text-slate-400 mt-2">
          Word / Errataで学習を最後まで終えると、ここに履歴が表示されます。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <label htmlFor="score-sort" className="text-sm text-slate-200">
          並び替え
        </label>
        <select
          id="score-sort"
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value as SortOption)}
          className="text-sm bg-white text-slate-800 border border-slate-200 rounded-lg pl-3 pr-8 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <ul className="space-y-3">
        {sortedScores.map((score) => (
          <li
            key={score.id}
            className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4"
          >
            <div>
              <p className="text-xs text-slate-400">
                {formatDateTime(score.created_at)}
              </p>
              <p className="text-sm font-semibold text-indigo-600 mt-1">
                {STUDY_TYPE_LABEL[score.study_type]}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-slate-800 font-medium">
                {score.correct_count} / {score.question_count}問
              </p>
              <p className="text-sm text-slate-500">
                正解率 {calcAccuracy(score)}%
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
