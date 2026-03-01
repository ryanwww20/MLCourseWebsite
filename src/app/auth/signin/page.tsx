"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function SignInPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,
      callbackUrl: "/home",
    });
    setLoading(false);
    if (res?.error) {
      setError("帳號或密碼錯誤");
      return;
    }
    if (res?.url) window.location.href = res.url;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-md px-4 py-16">
        <h1 className="text-2xl font-bold text-foreground mb-6">登入</h1>
        <form onSubmit={handleCredentials} className="space-y-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">帳號</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md text-foreground bg-background"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">密碼</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md text-foreground bg-background"
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="w-full px-4 py-2 bg-foreground text-background rounded-lg disabled:opacity-50">
            {loading ? "登入中…" : "登入"}
          </button>
        </form>
        <p className="text-sm text-muted">
          或{" "}
          <Link href="/api/auth/signin" className="text-foreground underline">
            使用 Google / GitHub 登入
          </Link>
        </p>
      </main>
    </div>
  );
}
