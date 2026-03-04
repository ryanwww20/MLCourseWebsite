import LessonDetailClient from "./LessonDetailClient";
import { getCourses, getLessons } from "@/lib/data";
import { notFound } from "next/navigation";

interface LessonDetailPageProps {
  params: Promise<{ courseId: string; lessonId: string }>;
}

export default async function LessonDetailPage({ params }: LessonDetailPageProps) {
  const { courseId, lessonId } = await params;
  const courses = getCourses();
  const lessons = getLessons();
  const lesson = lessons.find((l) => l.id === lessonId && l.courseId === courseId);
  if (!lesson) notFound();
  const course = courses.find((c) => c.id === courseId) ?? null;
  const relatedLessons = lessons.filter((l) => l.courseId === courseId && l.id !== lessonId);
  return (
    <LessonDetailClient
      courseId={courseId}
      lessonId={lessonId}
      lesson={lesson}
      course={course}
      relatedLessons={relatedLessons}
    />
  );
}
