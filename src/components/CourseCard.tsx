import Link from "next/link";
import { Course } from "@/mock/courses";

interface CourseCardProps {
  course: Course;
}

export default function CourseCard({ course }: CourseCardProps) {
  return (
    <Link href={`/courses/${course.id}`}>
      <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-semibold text-gray-900">{course.name}</h3>
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {course.semester}
          </span>
        </div>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">教師：</span>
            <span className="text-sm font-medium text-gray-700">{course.instructor}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {course.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

