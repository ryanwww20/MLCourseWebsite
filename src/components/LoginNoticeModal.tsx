"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "login-notice-dismissed";

export default function LoginNoticeModal() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const checkAndShow = useCallback(() => {
    if (status !== "authenticated") return;
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY) === "true";
      if (!dismissed) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, [status]);

  useEffect(() => {
    checkAndShow();
  }, [checkAndShow]);

  const handleClose = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem(STORAGE_KEY, "true");
      } catch {
        // ignore
      }
    }
    setOpen(false);
  };

  if (status !== "authenticated" || !open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* 背板 */}
      <button
        type="button"
        onClick={handleClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-label="關閉"
      />
      {/* 小視窗 */}
      <div
        className="relative w-full max-w-md rounded-xl border border-border bg-surface shadow-xl p-6 flex flex-col gap-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-notice-title"
      >
        <h2 id="login-notice-title" className="text-lg font-semibold text-foreground">
          Disclamer
        </h2>
        <div className="text-sm text-foreground/90 space-y-4">
          <p>歡迎使用課程輔助學習系統，請留意以下事項：</p>
          <ul className="list-disc list-inside space-y-1 text-muted">
            <li>與AI的對話紀錄會作為李宏毅教授實驗室的訓練資料，若不同意此做法，可點擊個人頭像-設定裡關閉授權</li>
            <li>AI 助教回覆僅供參考，重要內容請以課堂與教材為準。</li>
            <li>留言區請保持友善與課程相關討論。</li>
            <li>若遇系統異常，請聯繫課程助教。</li>
          </ul>
        </div>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-muted hover:text-foreground">
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
            className="rounded border-border text-accent focus:ring-accent"
          />
          <span>此後不再顯示</span>
        </label>
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-foreground text-background hover:opacity-90 transition-opacity"
          >
            確定
          </button>
        </div>
      </div>
    </div>
  );
}
