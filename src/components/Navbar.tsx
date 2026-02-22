"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavbarProps {
  variant?: "default" | "onDark";
}

export default function Navbar({ variant = "default" }: NavbarProps) {
  const pathname = usePathname();
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
          
          {/* 右側：Login */}
          <div className="ml-auto mr-10 flex items-center gap-4">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${onDark ? "bg-white/20" : "bg-foreground/10"}`}>
              <span className={`text-sm ${textActive}`}>U</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

