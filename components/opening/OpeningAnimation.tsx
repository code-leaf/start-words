'use client';

import React, { useEffect, useRef, useState } from 'react';
import '@/styles/opening/opening.css';

export type OpeningAnimationProps = {
  // trueの場合のみBGMを再生する（BGM確認モーダルでの選択結果をそのまま渡す、MVP15）。
  // falseの場合は<audio>要素自体を生成せず、演出はこれまで通り無音のまま進行する。
  audioEnabled: boolean;
  // オープニング終了時（全演出終了 or スキップ）に一度だけ呼ばれるコールバック。
  // 自動再生・手動再生のどちらで使うかはこの呼び出し元（親コンポーネント）が決める。
  onFinish: () => void;
};

// .opening-layer のfadeOut（50s delay + 3s duration）が完了するタイミング。
// イントロ5秒 → ロゴ5秒（10秒でほぼ消える）→ クロール開始(8秒)から
// フェードアウトが始まる50秒まで流れる → 3秒でオープニング全体をフェードアウト、
// という構成（詳しくはstyles/opening/opening.cssのコメントを参照）。
// 演出の見た目自体は素のCSS @keyframes（styles/opening/opening.css）が担っており、
// これはReact側へ「終わったこと」を知らせるための一度きりのタイマーに過ぎない
// （毎フレームの位置・拡大率などをJSで計算・更新することはしていない）。
const OPENING_TOTAL_DURATION_MS = 53000;

// BGM音源のパス。Web再生には（変換元のwavではなく）mp3を使用する。
const BGM_SRC = '/audio/opening-bgm.mp3';

/**
 * トップページのスターウォーズ風オープニング演出（イントロ文 → ロゴ → 3Dクロール）
 *
 * 既存PHP版 (src/index.php, src/css/SW_title.css) のCSS @keyframesアニメーションを
 * そのままNext.js版へ移植したコンポーネント。DOM構造・CSSクラスの対応関係は
 * styles/opening/opening.css 側のコメントを参照。
 *
 * このコンポーネントがJSで行っているのは以下の3点で、演出そのもの
 * （opacity・transform・背景色の時間変化）はすべてCSSの@keyframesが担っている。
 * - マウント時にスキップボタンへフォーカスする（キーボード・スクリーンリーダー対応）
 * - 53秒後、またはスキップ操作で、呼び出し元へ終了を通知する
 * - （MVP15で追加）audioEnabledがtrueのときのみBGMを再生し、Mute/Unmute切り替え・
 *   終了時の停止を管理する
 *
 * BGM再生とAutoplay Policyについて（MVP15）:
 * - このコンポーネント自体はBGM確認モーダルでユーザーが「🔊 音声ありで再生」を
 *   選択した後にだけマウントされる。つまりaudioEnabled=trueでのplay()呼び出しは、
 *   常にユーザーの明示的なクリック操作を起点とした一連の流れの中で行われるため、
 *   ページロード時の無許可自動再生（Autoplay Policyで多くのブラウザにブロックされる）
 *   には該当しない。それでも一部環境でplay()が失敗する可能性があるため、
 *   失敗時は例外を握りつぶし、無音のまま演出を継続する（演出自体は止めない）。
 */
export function OpeningAnimation({ audioEnabled, onFinish }: OpeningAnimationProps) {
  // onFinishが二重に呼ばれないようにするガード（タイマー満了とスキップクリックの両対応）
  const hasFinishedRef = useRef(false);
  const skipButtonRef = useRef<HTMLButtonElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  // ミュート状態。<audio muted>へ反映するReact側の状態として持つ
  // （DOM要素のmutedプロパティを直接書き換えるのではなく、宣言的に同期させる）
  const [isMuted, setIsMuted] = useState(false);

  const finish = () => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;

    // 通常終了・スキップのどちらの経路でも確実にBGMを停止し、
    // 次回再生時に前回の再生位置を引き継がないようcurrentTimeを0へ戻す
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    onFinish();
  };

  useEffect(() => {
    // マウント時にスキップボタンへフォーカスし、キーボード・スクリーンリーダー
    // 利用者がすぐにスキップ操作へたどり着けるようにする
    skipButtonRef.current?.focus();

    // 53秒後に自動終了させるタイマー。
    // React Strict Modeの開発時二重実行（mount→cleanup→mount）が起きても、
    // クリーンアップで必ずclearTimeoutするため、タイマーが二重に走ることはない。
    const timer = setTimeout(finish, OPENING_TOTAL_DURATION_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!audioEnabled) return;

    const audio = audioRef.current;
    if (!audio) return;

    // ユーザーがBGM確認モーダルで「🔊 音声ありで再生」を選んだこと（ユーザー操作）を
    // 起点として呼ばれるplay()。Autoplay Policyにより失敗する可能性はゼロではないため、
    // rejectしても演出自体は止めず、無音のまま続行する。
    audio.play().catch(() => {
      // 再生できなくても演出は継続する（意図的に何もしない）
    });

    // React Strict Modeでのmount→cleanup→mount時に二重再生が起きないよう、
    // クリーンアップで必ず一時停止する（実際のアンマウント時はfinish()側で
    // 既にpause+currentTime=0されているため、ここでのpauseは冪等）
    return () => {
      audio.pause();
    };
  }, [audioEnabled]);

  return (
    <div
      className="opening-layer"
      role="dialog"
      aria-modal="true"
      aria-label="オープニング演出"
    >
      {/* BGM音源。audioEnabled=falseの場合は要素自体を生成せず、
          不要なネットワーク取得（プリロード）も発生させない (MVP15)。
          BGMの尺は53秒でOPENING_TOTAL_DURATION_MSとほぼ一致するよう作られているため、
          loop指定はしない（末尾で不自然に頭出しされるのを避ける） */}
      {audioEnabled && (
        <audio ref={audioRef} src={BGM_SRC} muted={isMuted} preload="auto" />
      )}

      {/* p#start */}
      <p className="opening-intro">
        このWebアプリは<strong>あの有名な宇宙映画</strong>をオマージュして作成しています…
      </p>

      {/* #opening h1 */}
      <h1 className="opening-logo">
        START
        <br />
        WORDS
        <sub className="opening-logo-sub">単語帳アプリ</sub>
      </h1>

      {/* #titles */}
      <div className="opening-crawl" aria-hidden="true">
        {/* #titlecontent */}
        <div className="opening-crawl-track">
          <p className="opening-crawl-center">START</p>
          <p>通勤時間や昼休みに</p>
          <p>サクッと単語覚えに使える！</p>
          <p>ゲーム感覚で楽しく続けられる～</p>
          <p></p>
          <p>apple,orange, big, small, night, morning, believe, good</p>
          <p>～まもなく始まります～</p>
          <p> </p>
          <p>
            START WORDS START WORDS START WORDS START WORDS START WORDS START
            WORDS START WORDS
          </p>
        </div>
      </div>

      {/* BGM Mute/Unmuteトグル。BGMが有効な場合のみ表示する (MVP15) */}
      {audioEnabled && (
        <button
          type="button"
          className="opening-mute-toggle"
          aria-label={isMuted ? 'BGMのミュートを解除する' : 'BGMをミュートする'}
          onClick={() => setIsMuted((prev) => !prev)}
        >
          <span aria-hidden="true">{isMuted ? '🔇' : '🔊'}</span>
        </button>
      )}

      {/* button#skipBtn.skip */}
      <button
        ref={skipButtonRef}
        type="button"
        className="opening-skip"
        aria-label="オープニング演出をスキップしてホーム画面を表示する"
        onClick={finish}
      >
        スキップ
      </button>
    </div>
  );
}
