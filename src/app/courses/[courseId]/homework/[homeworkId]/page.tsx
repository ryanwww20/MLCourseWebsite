import Link from "next/link";
import Navbar from "@/components/Navbar";
import EditHomeworkButton from "@/components/EditHomeworkButton";
import { getHomework, getCourses } from "@/lib/data";
import { type HomeworkLink, type HomeworkLinkItem } from "@/mock/homework";
import { notFound } from "next/navigation";

/** 將 Video/Slides/Code/Platform 統一成陣列，方便遍歷多個連結 */
function normalizeLinks(link: HomeworkLink | undefined): HomeworkLinkItem[] {
  if (link == null) return [];
  if (typeof link === "string") return [{ url: link }];
  return link;
}

/** "YYYY-MM-DD HH:MM" → "YYYY/MM/DD HH:MM" */
function formatDeadline(deadlineStr: string) {
  const [datePart, timePart] = deadlineStr.split(" ");
  const time = timePart ?? "23:59";
  return `${datePart.replace(/-/g, "/")} ${time}`;
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return `${y}/${String(m).padStart(2, "0")}/${String(d).padStart(2, "0")}`;
}

interface HomeworkDetailPageProps {
  params: Promise<{ courseId: string; homeworkId: string }>;
}

export default async function HomeworkDetailPage({ params }: HomeworkDetailPageProps) {
  const { courseId, homeworkId } = await params;
  const homework = getHomework();
  const courses = getCourses();
  const hw = homework.find((h) => h.id === homeworkId && h.courseId === courseId);
  const course = courses.find((c) => c.id === courseId);

  if (!hw || !course) {
    notFound();
  }

  /** 與 LessonList 一致，icon 尺寸略大 */
  const iconLinkClass = "p-1 rounded hover:bg-foreground/10";
  const iconImgClass = "w-7 h-7 object-contain opacity-80 hover:opacity-100 transition-opacity";
  const defaultVideoIcon = "/icons/icon-youtube.png";
  const defaultSlidesIcon = "/icons/icon-pdf.png";
  const defaultCodeIcon = "/icons/icon-ppt.png";
  const defaultPlatformIcon = "/icons/gradescope.png";
  const ddClass = "text-sm leading-tight";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link
            href={`/courses/${courseId}?tab=homework`}
            className="text-sm text-muted hover:text-foreground inline-block"
          >
            ← 返回 Homework 列表
          </Link>
          <EditHomeworkButton homework={hw} />
        </div>

        <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-border">
            <h1 className="text-xl font-bold text-foreground">{hw.topic}</h1>
            <p className="text-sm text-muted mt-1">Homework {hw.week}</p>
          </div>

          <dl className="px-6 py-5 space-y-3">
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <dt className="text-sm font-medium text-muted w-24 shrink-0">Date</dt>
              <dd className={ddClass + " text-foreground"}>{formatDate(hw.date)}</dd>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <dt className="text-sm font-medium text-muted w-24 shrink-0">Video</dt>
              <dd className="leading-none flex items-center gap-1 flex-wrap">
                {normalizeLinks(hw.video).length === 0 ? (
                  <span className="text-sm text-muted">—</span>
                ) : (
                  normalizeLinks(hw.video).map((item, i) => (
                    <a key={i} href={item.url} target="_blank" rel="noopener noreferrer" className={iconLinkClass} aria-label={`Video ${i + 1}`}>
                      <img src={item.icon ?? hw.videoIcon ?? defaultVideoIcon} alt="" className={iconImgClass} width={28} height={28} />
                    </a>
                  ))
                )}
              </dd>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <dt className="text-sm font-medium text-muted w-24 shrink-0">Slides</dt>
              <dd className="leading-none flex items-center gap-1 flex-wrap">
                {normalizeLinks(hw.slides).length === 0 ? (
                  <span className="text-sm text-muted">—</span>
                ) : (
                  normalizeLinks(hw.slides).map((item, i) => (
                    <a key={i} href={item.url} target="_blank" rel="noopener noreferrer" className={iconLinkClass} aria-label={`Slides ${i + 1}`}>
                      <img src={item.icon ?? hw.slidesIcon ?? defaultSlidesIcon} alt="" className={iconImgClass} width={28} height={28} />
                    </a>
                  ))
                )}
              </dd>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <dt className="text-sm font-medium text-muted w-24 shrink-0">Code</dt>
              <dd className="leading-none flex items-center gap-1 flex-wrap">
                {normalizeLinks(hw.code).length === 0 ? (
                  <span className="text-sm text-muted">—</span>
                ) : (
                  normalizeLinks(hw.code).map((item, i) => (
                    <a key={i} href={item.url} target="_blank" rel="noopener noreferrer" className={iconLinkClass} aria-label={`Code ${i + 1}`}>
                      <img src={item.icon ?? hw.codeIcon ?? defaultCodeIcon} alt="" className={iconImgClass} width={28} height={28} />
                    </a>
                  ))
                )}
              </dd>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <dt className="text-sm font-medium text-muted w-24 shrink-0">Platform</dt>
              <dd className="leading-none flex items-center gap-1 flex-wrap">
                {normalizeLinks(hw.platform).length === 0 ? (
                  <span className="text-sm text-muted">—</span>
                ) : (
                  normalizeLinks(hw.platform).map((item, i) => (
                    <a key={i} href={item.url} target="_blank" rel="noopener noreferrer" className={iconLinkClass} aria-label={`Platform ${i + 1}`}>
                      <img src={item.icon ?? hw.platformIcon ?? defaultPlatformIcon} alt="" className={iconImgClass} width={28} height={28} />
                    </a>
                  ))
                )}
              </dd>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <dt className="text-sm font-medium text-muted w-24 shrink-0">Deadline</dt>
              <dd className={ddClass + " text-foreground font-medium text-[#EE0000]"}>{formatDeadline(hw.deadline)}</dd>
            </div>
            {hw.ta != null && (
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <dt className="text-sm font-medium text-muted w-24 shrink-0">TA</dt>
                <dd className={ddClass + " text-foreground"}>{hw.ta}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}
