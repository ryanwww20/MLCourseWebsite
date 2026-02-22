"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const THEME_KEY = "theme";

function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY) as "light" | "dark" | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const resolved = stored ?? (prefersDark ? "dark" : "light");
    setTheme(resolved);
    document.documentElement.setAttribute("data-theme", resolved);
  }, []);

  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem(THEME_KEY, next);
    document.documentElement.setAttribute("data-theme", next);
  };

  return { theme, toggle };
}

interface NavbarProps {
  variant?: "default" | "onDark";
}

export default function Navbar({ variant = "default" }: NavbarProps) {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const onDark = variant === "onDark";
  const textActive = onDark ? "text-white" : "text-foreground";
  const textInactive = onDark ? "text-white/70 hover:text-white" : "text-muted hover:text-foreground";
  const navBg = onDark ? "bg-transparent" : "bg-topBg";

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
    <nav className={navBg}>
      <div className="sm:px-6 lg:px-8">
        <div className="flex h-16 items-center">

          {/* 左側 Logo */}
          <Link href="/home" className="flex items-center gap-3">
            <div className={`h-8 w-8 rounded-md ${onDark ? "bg-white/20" : "bg-foreground/10"}`} />
            <span className={`text-lg font-bold ${textActive}`}>
              LAB LAND
            </span>
          </Link>

          {/* 中間靠左 Menu */}
          <div className="ml-10 flex items-center gap-8">
            <NavItem href="/home" label="Home" />
            <NavItem href="/courses" label="Courses" />
            <NavItem href="/course_map" label="Course Map" />
          </div>
          
          {/* 右側：主題切換 + Login */}
          <div className="ml-auto mr-10 flex items-center gap-4">
            <button
              type="button"
              onClick={toggle}
              className={`p-2 rounded-lg hover:scale-110 active:scale-95 transition-all duration-200 ease-out ${
                onDark ? "text-white hover:bg-white/15" : "text-foreground hover:bg-foreground/15"
              }`}
              aria-label={theme === "dark" ? "切換至淺色模式" : "切換至深色模式"}
            >
              {theme === null ? (
                <span className="w-5 h-5 block" />
              ) : theme === "dark" ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${onDark ? "bg-white/20" : "bg-foreground/10"}`}>
              <span className={`text-sm ${textActive}`}>U</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

