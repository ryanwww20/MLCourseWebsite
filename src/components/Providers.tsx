"use client";

import { SessionProvider } from "next-auth/react";
import LoginNoticeModal from "@/components/LoginNoticeModal";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <LoginNoticeModal />
    </SessionProvider>
  );
}
