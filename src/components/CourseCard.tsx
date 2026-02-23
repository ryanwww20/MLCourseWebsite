import Link from "next/link";
import { Course } from "@/mock/courses";

interface CourseCardProps {
  course: Course;
}

export default function CourseCard({ course }: CourseCardProps) {
  return (
    <div className="bg-surface rounded-lg border border-border p-6 h-full flex flex-col">
      <h3 className="text-xl font-semibold text-foreground">{course.name}</h3>
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="text-sm text-muted">{course.semester}</span>
        <Link
          href={`/courses/${course.id}`}
          className="shrink-0 px-4 py-2 text-sm font-medium text-foreground border border-border rounded-lg hover:bg-foreground/5 transition-colors"
        >
          View
        </Link>
      </div>
    </div>
  );
}

