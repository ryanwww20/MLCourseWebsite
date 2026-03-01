"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";

const CONSENT_STORAGE_KEY = "settings-chat-records-consent";

function loadConsent(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (stored === "false") return false;
    return true; // 預設同意（未設定或 "true"）
  } catch {
    return true;
  }
}

function saveConsent(value: boolean) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, value ? "true" : "false");
  } catch {
    // ignore
  }
}

export default function SettingsPage() {
  const [consent, setConsent] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setConsent(loadConsent());
    setMounted(true);
  }, []);

  const handleToggle = () => {
    const next = !consent;
    setConsent(next);
    saveConsent(next);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="w-full border-b border-border bg-surface">
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-foreground mb-8">設定</h1>

          <div className="rounded-xl border border-border bg-background p-6">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-foreground flex-1">
                同意把個人聊天紀錄用於李宏毅教授實驗室訓練資料使用
              </p>
              <button
                type="button"
                role="switch"
                aria-checked={consent}
                onClick={handleToggle}
                className={`relative inline-flex h-7 w-12 flex-shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${mounted ? (consent ? "bg-green-500" : "bg-gray-300") : "bg-gray-300"}`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-200 mt-0.5 ${consent ? "translate-x-5 ml-0.5" : "translate-x-0.5"}`}
                />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
