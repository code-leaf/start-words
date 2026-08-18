'use client';

import { useEffect, useState } from 'react';

// 視聴済みフラグの保存キー。既存コードにsessionStorage利用箇所はないため衝突しない。
const OPENING_VIEWED_KEY = 'openingViewed';

/**
 * トップページ初回アクセス時にオープニングを自動再生するための状態管理フック
 *
 * sessionStorageを使う理由:
 * - タブを閉じれば消える（＝再度アクセスしたときは初回として扱いたい）が、
 *   同一タブ内でトップページへ戻ってきたときは再生したくない、という要件に合うため。
 *   localStorageだと端末に永続化されてしまい、後日の訪問でも再生されなくなる。
 *
 * isReadyを分離している理由:
 * - サーバーサイドレンダリング時点ではsessionStorageを参照できない（windowが存在しない）。
 *   マウント前から「再生する/しない」を決め打ちすると、サーバーとクライアントで
 *   表示内容が食い違いhydrationエラーの原因になるため、マウント後に判定するまでは
 *   オープニングを一切表示しない状態として扱う。
 */
export function useOpeningAutoplay() {
  const [shouldAutoPlay, setShouldAutoPlay] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // sessionStorage（ブラウザ側のみに存在する外部ストア）の初回状態をReactへ
    // 同期するための処理。サーバーではwindowが存在せず判定できないため、
    // マウント後にここで読み取って初めて確定させる必要があり、
    // setStateをeffect内で呼ぶこと自体がこのユースケースでは正しい選択となる。
    // 読み取りだけの副作用のない処理のため、Strict Modeでこのeffectが
    // 二重実行されても（同じ値を2回setStateするだけで）問題は起きない。
    /* eslint-disable react-hooks/set-state-in-effect -- 上記コメントの通り、
       サーバーで参照できないsessionStorageの値をマウント後に確定させるための
       意図的なsetStateであるため無効化する */
    const viewed = window.sessionStorage.getItem(OPENING_VIEWED_KEY);
    setShouldAutoPlay(viewed === null);
    setIsReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // 最後まで視聴した場合・スキップした場合の両方でこの関数を呼び、視聴済みとして記録する
  const markViewed = () => {
    window.sessionStorage.setItem(OPENING_VIEWED_KEY, 'true');
    setShouldAutoPlay(false);
  };

  return {
    // isReady判定が済むまではfalse固定にし、SSR直後に一瞬オープニングが
    // 表示される／されないのちらつきを防ぐ
    shouldAutoPlay: isReady && shouldAutoPlay,
    markViewed,
  };
}
