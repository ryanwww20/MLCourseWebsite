import Link from "next/link";
import { Course } from "@/mock/courses";

interface CourseCardProps {
  course: Course;
}

export default function CourseCard({ course }: CourseCardProps) {
  return (
    <Link href={`/courses/${course.id}`}>
      <div className="bg-surface rounded-lg border border-border p-6 hover:shadow-sm transition-shadow cursor-pointer h-full">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-semibold text-foreground">{course.name}</h3>
          <span className="text-sm text-muted bg-foreground/5 px-2 py-1 rounded">
            {course.semester}
          </span>
        </div>
        <p className="text-muted text-sm mb-4 line-clamp-2">{course.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted">教師：</span>
            <span className="text-sm font-medium text-foreground">{course.instructor}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {course.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-1 bg-foreground/10 text-foreground rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

