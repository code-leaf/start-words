import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ModalProvider } from "@/contexts/ModalContext";
import { Modal } from "@/components/Modal";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthStatusBadge } from "@/components/AuthStatusBadge";
import { SpaceBackground } from "@/components/SpaceBackground";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// オープニング演出のフォントについて:
// 既存PHP版はGoogle Fonts「Droid Sans」を直接読み込んでいるが、
// Droid Sansはnext/font/googleのフォント一覧に存在しない（Google側で提供終了）ため
// 読み込めない。今回は代替フォント（Roboto等）へ勝手に置き換えず、
// PHP版が元々指定しているフォールバック順（'Droid Sans', arial, verdana, sans-serif）を
// そのままstyles/opening/opening.cssのfont-familyへ指定している。
// Droid Sansが見つからない環境では、PHP版と同じくarial/verdanaへフォールバックする。

export const metadata: Metadata = {
  title: 'start-words',
  description:
    '単語力は英語学習の出発点。フラッシュカードで、はじめの一歩を踏み出そう。',
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SpaceBackground />
        <AuthProvider>
          <ModalProvider>
            {children}
            <Modal />
          </ModalProvider>
          <AuthStatusBadge />
        </AuthProvider>
      </body>
    </html>
  );
}

