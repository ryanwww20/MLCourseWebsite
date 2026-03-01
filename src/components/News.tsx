import Link from "next/link";

// 在此新增/修改 News 項目：date (YYYY-MM-DD)、title、description，選填 href 可變成連結
const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const newsItems = [
  { date: "2026-02-10", title: "網站上線", description: "機器學習課程 AI 輔助學習系統正式上線。", href: "" },
  // Course Map 尚未上線，先隱藏
  // { date: "2026-02-08", title: "課程地圖開放", description: "Course Map 已開放，可查看課程架構。", href: "/course_map" },
];

function formatNewsDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return { year: y, dateLabel: `${MONTH_ABBR[m - 1]} ${d}` };
}

export default function News() {
  return (
    <section className="w-full border-b border-border bg-background">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-foreground text-center mb-8">
          News
        </h2>
        <div className="space-y-6">
          {newsItems.map((item) => {
            const { year, dateLabel } = formatNewsDate(item.date);
            const block = (
              <div className="flex gap-6 p-4 rounded-xl border border-border bg-surface">
                <div className="flex-shrink-0 text-muted text-sm leading-tight w-16">
                  <div>{year}</div>
                  <div className="text-foreground text-lg font-semibold">{dateLabel}</div>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                  {item.description && (
                    <p className="text-muted text-sm mt-1">{item.description}</p>
                  )}
                </div>
              </div>
            );
            if (item.href) {
              return (
                <Link
                  key={item.date + item.title}
                  href={item.href}
                  className="block hover:opacity-90 transition-opacity"
                >
                  {block}
                </Link>
              );
            }
            return <div key={item.date + item.title}>{block}</div>;
          })}
        </div>
      </div>
    </section>
  );
}
