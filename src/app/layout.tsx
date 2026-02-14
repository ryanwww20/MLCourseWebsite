import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "課程輔助學習系統",
  description: "架設類似 NTU Cool 的課程網站，會同步上傳老師的 ML 2026 課程錄影",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

