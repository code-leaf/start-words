'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { ModalType, ModalButtonConfig } from '@/types/modal';
import { modalContents } from '@/lib/modalContents';

// 表示用に解決されたアクティブモーダル情報型
export type ActiveModal = {
  title: string;
  message: string;
  buttons: ModalButtonConfig[];
  closeOnOverlayClick: boolean;
  onAction?: (actionKey: string) => void;
};

// ModalContextが提供する値の型定義
export type ModalContextType = {
  // モーダルが表示状態かどうか（フェードイン/アウトの見た目を制御する）
  isOpen: boolean;
  // 直近に開かれたモーダルの解決済み設定。closeModal時にはクリアしない（後述）
  activeModal: ActiveModal | null;
  openModal: (
    type: ModalType,
    data?: unknown,
    onAction?: (actionKey: string) => void,
  ) => void;
  closeModal: () => void;
};

const ModalContext = createContext<ModalContextType | undefined>(undefined);

/**
 * アプリケーション全体にモーダル状態を提供するプロバイダーコンポーネント
 *
 * 目的:
 * - PHP版 modal.php の openModal と同様に、どの画面・コンポーネントからでもモーダルを開閉可能にする
 *
 * isOpenとactiveModalを分離している理由:
 * - closeModal時にactiveModalまで即座にnullへ戻すと、フェードアウト中にタイトルや
 *   メッセージが一瞬で消えてしまい、Modal.tsx側でrefやuseEffectを使って「直前の内容」を
 *   保持する実装が必要になる。React 19のreact-hooks/refsルールはrender中のref読み書きを
 *   禁止しているため、その保持責務は描画側ではなく状態の持ち主であるここに置く。
 * - closeModalはisOpenをfalseにするだけでactiveModalは保持し、次にopenModalが
 *   呼ばれた時にだけ内容を差し替える。これによりModal.tsx側は素直な派生描画だけで
 *   フェードアウトを表現でき、ローカルstate/ref/effectが一切不要になる。
 */
export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<ActiveModal | null>(null);

  const openModal = useCallback(
    (
      type: ModalType,
      data?: unknown,
      onAction?: (actionKey: string) => void,
    ) => {
      const config = modalContents[type];
      if (!config) return;

      const resolvedMessage =
        typeof config.message === 'function'
          ? config.message(data)
          : config.message;

      setActiveModal({
        title: config.title,
        message: resolvedMessage,
        buttons: config.buttons,
        closeOnOverlayClick: config.closeOnOverlayClick,
        onAction,
      });
      setIsOpen(true);
    },
    [],
  );

  // 表示状態のみをfalseにする（activeModalは意図的にクリアしない。上記コメント参照）
  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      isOpen,
      activeModal,
      openModal,
      closeModal,
    }),
    [isOpen, activeModal, openModal, closeModal],
  );

  return (
    <ModalContext.Provider value={value}>{children}</ModalContext.Provider>
  );
}

/**
 * モーダル操作用カスタムフック
 */
export function useModal(): ModalContextType {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}