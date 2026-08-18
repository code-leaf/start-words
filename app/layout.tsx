import type { Metadata } from "next";
import { Geist, Geist_Mono, Roboto } from "next/font/google";
import "./globals.css";
import { ModalProvider } from "@/contexts/ModalContext";
import { Modal } from "@/components/Modal";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthStatusBadge } from "@/components/AuthStatusBadge";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// オープニング演出用フォント。
// 既存PHP版はGoogle Fonts「Droid Sans」を直接読み込んでいるが、
// Droid SansはGoogleにより後継の「Roboto」へ統合されておりnext/font/googleの
// フォント一覧にも存在しないため、直接のGoogle Fonts CDN読み込みは行わず、
// next/font/google経由で読み込める後継フォントRoboto（同じくGoogle製・似た書体）で代替する。
const roboto = Roboto({
  variable: "--font-opening-sans",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: 'start-words',
  description:
    '単語力は英語学習の出発点。フラッシュカードで、はじめの一歩を踏み出そう。',
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${roboto.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
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

