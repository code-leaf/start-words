'use client';

import React, { useState } from 'react';
import { runRLSTests, RLSTestResult } from '@/lib/rls-verifier';

interface RLSTestPanelProps {
  currentUserId: string | null;
}

/**
 * Requirement 19: RLS (Row Level Security) 動作検証UIパネル
 * 
 * ボタンをクリックすると、PostgreSQL上の 4つの RLS ポリシー (SELECT / INSERT / UPDATE / DELETE)
 * および ユーザー分離が正常機能しているかを自動検証テスト 1〜6 を実行して結果を表示します。
 */
export function RLSTestPanel({ currentUserId }: RLSTestPanelProps) {
  const [testResults, setTestResults] = useState<RLSTestResult[] | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleRunTests = async () => {
    setIsRunning(true);
    try {
      const results = await runRLSTests(currentUserId);
      setTestResults(results);
    } catch (err: unknown) {
      console.error('RLSテスト実行エラー:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const allPassed = testResults && testResults.every((t) => t.passed);
  const passedCount = testResults ? testResults.filter((t) => t.passed).length : 0;

  return (
    <div className="w-full max-w-3xl mx-auto p-5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-4 shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono flex items-center gap-2">
            <span>🛡️</span> RLS 動作自動検証パネル (Requirement 19)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            PostgreSQL側のアクセス制限（SELECT/INSERT/UPDATE/DELETE）をテストします
          </p>
        </div>

        <button
          onClick={handleRunTests}
          disabled={isRunning}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isRunning ? (
            <>
              <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              検証中...
            </>
          ) : (
            <>
              <span>⚡</span> RLS 検証テスト 1〜6 を実行
            </>
          )}
        </button>
      </div>

      {testResults && (
        <div className="space-y-3 pt-2">
          {/* 総合評価 */}
          <div
            className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold ${
              allPassed
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}
          >
            <span>
              {allPassed ? '🎉 全6項目の RLS 検証が合格しました！' : '⚠️ 一部テスト項目に注意点またはスキップがあります'}
            </span>
            <span className="font-mono">
              {passedCount} / {testResults.length} PASSED
            </span>
          </div>

          {/* テスト結果リスト */}
          <div className="space-y-2">
            {testResults.map((test) => (
              <div
                key={test.id}
                className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1 text-xs"
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-200">{test.title}</span>
                  <span
                    className={`px-2 py-0.5 rounded font-mono text-[10px] uppercase font-bold ${
                      test.passed
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {test.passed ? 'PASS' : 'FAIL'}
                  </span>
                </div>
                <p className="text-slate-400 text-[11px]">{test.description}</p>
                <div className="pt-1 text-[11px] text-slate-300 bg-slate-900/60 p-2 rounded border border-slate-800/80 font-mono">
                  <p><span className="text-indigo-400">期待結果:</span> {test.expected}</p>
                  <p className="mt-0.5"><span className="text-emerald-400">実行結果:</span> {test.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
