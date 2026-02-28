"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

interface NavbarProps {
  variant?: "default" | "onDark";
}

export default function Navbar({ variant = "default" }: NavbarProps) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const onDark = variant === "onDark";
  const textActive = onDark ? "text-white" : "text-foreground";
  const textInactive = onDark ? "text-white/70 hover:text-white" : "text-muted hover:text-foreground";
  const navBg = onDark ? "bg-transparent" : "bg-topBg";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const NavItem = ({ href, label }: { href: string; label: string }) => {
    const isActive = pathname.startsWith(href);
    return (
      <Link
        href={href}
        className={`flex items-center justify-center gap-2 w-17 font-medium text-sm transition-colors ${
          isActive ? textActive : textInactive
        }`}
      >
        <span className={`${isActive ? "opacity-100" : "opacity-0"}`}>
          {"›"}
        </span>

        <span>{label}</span>

        <span className={`${isActive ? "opacity-100" : "opacity-0"}`}>
          {"‹"}
        </span>
      </Link>
    );
  };

  return (
    <nav className={`sticky top-0 z-50 ${navBg}`}>
      <div className="sm:px-6 lg:px-8">
        <div className="flex h-16 items-center">

          {/* 左側 Logo */}
          <Link href="/home" className="flex items-center gap-3">
            <div className={`h-8 w-8 rounded-md ${onDark ? "bg-white/20" : "bg-foreground/10"}`} />
            <span className={`text-lg font-bold ${textActive}`}>
              ML Website
            </span>
          </Link>

          {/* 中間靠左 Menu */}
          <div className="ml-10 flex items-center gap-8">
            <NavItem href="/home" label="Home" />
            <NavItem href="/courses" label="Courses" />
            {/* Course Map 尚未上線，先隱藏
            <NavItem href="/course_map" label="Course Map" />
            */}
          </div>
          
          {/* 右側：登入 / 使用者 */}
          <div className="ml-auto mr-10 flex items-center gap-4">
            {status === "loading" ? (
              <div className={`h-8 w-8 rounded-full animate-pulse ${onDark ? "bg-white/20" : "bg-foreground/10"}`} />
            ) : session?.user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2 rounded-full focus:outline-none"
                >
                  {session.user.image ? (
                    <img
                      src={session.user.image}
                      alt=""
                      className="h-8 w-8 rounded-full object-cover ring-2 ring-transparent hover:ring-foreground/20 transition-all"
                    />
                  ) : (
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${onDark ? "bg-white/20" : "bg-foreground/10"}`}>
                      <span className={`text-sm font-medium ${textActive}`}>
                        {session.user.name?.[0] ?? session.user.email?.[0] ?? "U"}
                      </span>
                    </div>
                  )}
                  <span className={`text-sm font-medium ${onDark ? "text-white/90" : "text-foreground"}`}>
                    {session.user.name ?? session.user.email}
                  </span>
                  <svg
                    className={`w-3.5 h-3.5 transition-transform ${dropdownOpen ? "rotate-180" : ""} ${onDark ? "text-white/70" : "text-muted"}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-lg border border-border bg-surface shadow-lg py-1 z-50">
                    <div className="px-4 py-2 border-b border-border">
                      <p className="text-xs text-muted truncate">{session.user.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setDropdownOpen(false); signOut(); }}
                      className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-foreground/5 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/api/auth/signin"
                className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                  onDark ? "text-white bg-white/20 hover:bg-white/30" : "text-foreground bg-foreground/10 hover:bg-foreground/15"
                }`}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

