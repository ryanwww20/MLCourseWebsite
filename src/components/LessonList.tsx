import Link from "next/link";
import { Lesson } from "@/mock/lessons";

const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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
        <Link
          key={lesson.id}
          href={`/courses/${courseId}/lessons/${lesson.id}`}
          className="block"
        >
          <div className="bg-surface rounded-lg border border-border p-4 hover:border-accent hover:shadow-sm transition-all cursor-pointer flex items-center gap-4">
            <div className="flex-shrink-0 text-muted text-sm leading-tight w-16">
              <div>Week {lesson.week}</div>
              <div className="text-lg text-foreground font-semibold">{formatDate(lesson.date)}</div>
            </div>
            <h4 className="text-lg font-semibold text-foreground flex-1 min-w-0">
              {lesson.title}
            </h4>
          </div>
        </Link>
      ))}
    </div>
  );
}

