import Link from "next/link";
import { Lesson } from "@/mock/lessons";

interface LessonListProps {
  lessons: Lesson[];
  courseId: string;
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
          <div className="bg-surface rounded-lg border border-border p-4 hover:border-accent hover:shadow-sm transition-all cursor-pointer">
            <div className="flex items-start justify-between mb-2">
              <h4 className="text-lg font-semibold text-foreground">{lesson.title}</h4>
              <span className="text-sm text-muted">{lesson.date}</span>
            </div>
            <div className="flex items-center space-x-4 text-sm text-muted">
              <span className="flex items-center space-x-1">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <span>{lesson.videoCount} 部影片</span>
              </span>
              {lesson.materialLinks.length > 0 && (
                <span className="flex items-center space-x-1">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span>{lesson.materialLinks.length} 個教材</span>
                </span>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

