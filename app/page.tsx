export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-3xl w-full text-center space-y-8 z-10">
        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold tracking-wide uppercase">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          MVP 0 : Initial Setup Ready
        </div>

        {/* Hero Title */}
        <div className="space-y-4">
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            start-words
          </h1>
          <p className="text-lg text-slate-400 max-w-xl mx-auto">
            Next.js アプリケーションのプロジェクト基盤が正常に作成されました。
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-4 text-left">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
            <div className="text-xs font-mono text-indigo-400 mb-1">FRAMEWORK</div>
            <div className="text-base font-bold text-white">Next.js (App Router)</div>
            <div className="text-xs text-slate-400 mt-1">最新の App Router 構成</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
            <div className="text-xs font-mono text-blue-400 mb-1">LANGUAGE</div>
            <div className="text-base font-bold text-white">TypeScript</div>
            <div className="text-xs text-slate-400 mt-1">型安全な開発環境</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
            <div className="text-xs font-mono text-cyan-400 mb-1">STYLING</div>
            <div className="text-base font-bold text-white">Tailwind CSS</div>
            <div className="text-xs text-slate-400 mt-1">ユーティリティファーストCSS</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
            <div className="text-xs font-mono text-amber-400 mb-1">LINTER</div>
            <div className="text-base font-bold text-white">ESLint</div>
            <div className="text-xs text-slate-400 mt-1">コード品質の自動チェック</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
            <div className="text-xs font-mono text-emerald-400 mb-1">DIRECTORY</div>
            <div className="text-base font-bold text-white">start-words/</div>
            <div className="text-xs text-slate-400 mt-1">標準ディレクトリ構造</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
            <div className="text-xs font-mono text-purple-400 mb-1">STATUS</div>
            <div className="text-base font-bold text-white">Dev Server</div>
            <div className="text-xs text-slate-400 mt-1">正常動作確認済み</div>
          </div>
        </div>
      </div>
    </main>
  );
}
