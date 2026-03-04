"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function DebugPage() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [endpoints, setEndpoints] = useState<Record<string, string>>({});
  const [allLinks, setAllLinks] = useState<string[]>([]);

  useEffect(() => {
    const tests: Record<string, string> = {};

    Promise.all([
      fetch("/course/api/auth/session")
        .then((r) => r.text())
        .then((t) => (tests["GET /course/api/auth/session"] = `${t.slice(0, 200)}`))
        .catch((e) => (tests["GET /course/api/auth/session"] = `ERROR: ${e}`)),
      fetch("/course/api/auth/providers")
        .then((r) => r.text())
        .then((t) => (tests["GET /course/api/auth/providers"] = `${t.slice(0, 500)}`))
        .catch((e) => (tests["GET /course/api/auth/providers"] = `ERROR: ${e}`)),
      fetch("/course/api/auth/csrf")
        .then((r) => r.text())
        .then((t) => (tests["GET /course/api/auth/csrf"] = `${t.slice(0, 200)}`))
        .catch((e) => (tests["GET /course/api/auth/csrf"] = `ERROR: ${e}`)),
    ]).then(() => setEndpoints(tests));

    const links = Array.from(document.querySelectorAll("a[href]")).map(
      (a) => `${a.textContent?.trim() || "(no text)"} → ${a.getAttribute("href")}`
    );
    setTimeout(() => {
      const links2 = Array.from(document.querySelectorAll("a[href]")).map(
        (a) => `${a.textContent?.trim() || "(no text)"} → ${a.getAttribute("href")}`
      );
      setAllLinks(links2.length > links.length ? links2 : links);
    }, 2000);
  }, []);

  return (
    <div style={{ padding: 32, fontFamily: "monospace", fontSize: 14 }}>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>Debug Info</h1>

      <Section title="Environment">
        <Row label="window.location.href" value={typeof window !== "undefined" ? window.location.href : "SSR"} />
        <Row label="usePathname()" value={pathname} />
        <Row label="NEXT_PUBLIC_BASE_PATH" value={process.env.NEXT_PUBLIC_BASE_PATH ?? "(not set)"} />
      </Section>

      <Section title="Session (useSession)">
        <Row label="status" value={status} />
        <Row label="session" value={JSON.stringify(session, null, 2)} />
      </Section>

      <Section title="API Endpoint Tests">
        {Object.entries(endpoints).map(([k, v]) => (
          <Row key={k} label={k} value={v} />
        ))}
        {Object.keys(endpoints).length === 0 && <p>Loading...</p>}
      </Section>

      <Section title="Navigation Links (test clicks)">
        <NavLink href="/home" label="Link → /home" />
        <NavLink href="/courses" label="Link → /courses" />
        <NavLink href="/settings" label="Link → /settings" />
        <NavLink href="/api/auth/signin" label="Link → /api/auth/signin (Sign In)" />
        <p style={{ marginTop: 8, color: "#888" }}>
          All above use Next.js Link (should auto-prefix /course).
          Check the actual href in browser DevTools.
        </p>
      </Section>

      <Section title="All &lt;a&gt; hrefs on this page">
        {allLinks.map((l, i) => (
          <div key={i} style={{ marginBottom: 2 }}>{l}</div>
        ))}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24, border: "1px solid #333", borderRadius: 8, padding: 16 }}>
      <h2 style={{ fontSize: 18, marginBottom: 8, borderBottom: "1px solid #555", paddingBottom: 4 }}>{title}</h2>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: 16, marginBottom: 4 }}>
      <span style={{ color: "#8af", minWidth: 300 }}>{label}:</span>
      <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{value}</pre>
    </div>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <Link href={href} style={{ color: "#fa0", textDecoration: "underline" }}>
        {label}
      </Link>
    </div>
  );
}
