"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

interface NavbarProps {
  variant?: "default" | "onDark";
}

export default function Navbar({ variant = "default" }: NavbarProps) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
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
          
          {/* 右側：登入 / 使用者 */}
          <div className="ml-auto mr-10 flex items-center gap-4">
            {status === "loading" ? (
              <div className={`h-8 w-8 rounded-full ${onDark ? "bg-white/20" : "bg-foreground/10"}`} />
            ) : session?.user ? (
              <div className="flex items-center gap-3">
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt=""
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${onDark ? "bg-white/20" : "bg-foreground/10"}`}>
                    <span className={`text-sm ${textActive}`}>
                      {session.user.name?.[0] ?? session.user.email?.[0] ?? "U"}
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => signOut()}
                  className={`text-sm font-medium ${onDark ? "text-white/80 hover:text-white" : "text-muted hover:text-foreground"}`}
                >
                  Sign Out
                </button>
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

