import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl mb-6">
            課程輔助學習系統
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            架設類似 NTU Cool 的課程網站，會同步上傳老師的 ML 2026 課程錄影
          </p>
          <Link
            href="/courses"
            className="inline-block px-8 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors shadow-lg"
          >
            進入課程列表
          </Link>
        </div>
      </main>
    </div>
  );
}

