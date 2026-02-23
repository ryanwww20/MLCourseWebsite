import Link from "next/link";
import { Lesson } from "@/mock/lessons";

const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const iconImgClass = "w-5 h-5 object-contain opacity-80 hover:opacity-100 transition-opacity";

interface LessonListProps {
  lessons: Lesson[];
  courseId: string;
}

function formatDate(dateStr: string) {
  const [, m, d] = dateStr.split("-").map(Number);
  return `${MONTH_ABBR[m - 1]} ${d}`;
}

export default function LessonList({ lessons, courseId }: LessonListProps) {
  return (
    <div className="space-y-3">
      {lessons.map((lesson) => (
        <div
          key={lesson.id}
          className="bg-surface rounded-lg border border-border p-4 hover:border-accent hover:shadow-sm transition-all flex items-center gap-4"
        >
          <Link
            href={`/courses/${courseId}/lessons/${lesson.id}`}
            className="flex-1 flex items-center gap-4 min-w-0 cursor-pointer"
          >
            <div className="flex-shrink-0 text-muted text-sm leading-tight w-16">
              <div>Week {lesson.week}</div>
              <div className="text-lg text-foreground font-semibold">{formatDate(lesson.date)}</div>
            </div>
            <h4 className="text-lg font-semibold text-foreground flex-1 min-w-0">
              {lesson.title}
            </h4>
          </Link>
          <div className="flex items-center gap-3 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            {lesson.youtubeLink && (
              <a
                href={lesson.youtubeLink}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 rounded hover:bg-foreground/10"
                aria-label="YouTube"
              >
                <img src="/icons/icon-youtube.png" alt="" className={iconImgClass} width={20} height={20} />
              </a>
            )}
            {lesson.pptLink && (
              <a
                href={lesson.pptLink}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 rounded hover:bg-foreground/10"
                aria-label="PPT"
              >
                <img src="/icons/icon-ppt.png" alt="" className={iconImgClass} width={20} height={20} />
              </a>
            )}
            {lesson.pdfLink && (
              <a
                href={lesson.pdfLink}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 rounded hover:bg-foreground/10"
                aria-label="PDF"
              >
                <img src="/icons/icon-pdf.png" alt="" className={iconImgClass} width={20} height={20} />
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

