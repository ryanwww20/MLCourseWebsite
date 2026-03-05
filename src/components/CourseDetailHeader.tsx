"use client";

import DeleteCourseButton from "@/components/DeleteCourseButton";

interface CourseDetailHeaderProps {
  courseId: string;
  courseName: string;
}

export default function CourseDetailHeader({ courseId, courseName }: CourseDetailHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 mb-6">
      <h1 className="text-2xl font-bold text-foreground">{courseName}</h1>
      <DeleteCourseButton courseId={courseId} courseName={courseName} />
    </div>
  );
}
