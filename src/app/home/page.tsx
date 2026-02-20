import Link from "next/link";
import Navbar from "@/components/Navbar";
import News from "@/components/News";

const features = [
  {
    href: "/courses",
    label: "Courses",
    description: "課程列表",
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    href: "/course_map",
    label: "Course Map",
    description: "課程地圖",
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
  },
  {
    href: "#",
    label: "AI Assistant",
    description: "AI 助教",
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    href: "#",
    label: "留言討論串",
    description: "討論區",
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* 1. Welcome — 佔滿橫幅 */}
      <section className="w-full border-b border-border bg-surface">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-medium tracking-widest text-muted uppercase mb-3">
            Welcome To
          </p>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl md:text-4xl">
            機器學習課程
            <br />
            AI 輔助學習系統
          </h1>
        </div>
      </section>

      <News />

      {/* 3. Features — 四個 icon 區塊，佔滿橫幅 */}
      <section className="w-full border-b border-border bg-background">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-foreground text-center mb-12">
            Features
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((item) => {
              const content = (
                <>
                  <div className="text-foreground mb-4">{item.icon}</div>
                  <h3 className="text-lg font-semibold text-foreground">{item.label}</h3>
                  <p className="text-sm text-muted mt-1">{item.description}</p>
                </>
              );
              const className =
                "flex flex-col items-center text-center p-6 rounded-xl border border-border bg-surface hover:border-foreground/30 hover:bg-foreground/5 transition-colors";
              if (item.href === "#") {
                return (
                  <div key={item.label} className={className}>
                    {content}
                  </div>
                );
              }
              return (
                <Link key={item.label} href={item.href} className={className}>
                  {content}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Contact — 佔滿橫幅 */}
      <section className="w-full bg-surface">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Contact</h2>
          <p className="text-muted">如有問題或建議，歡迎與我們聯繫。</p>
        </div>
      </section>
    </div>
  );
}
