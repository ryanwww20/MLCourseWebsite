import { lessons } from "@/mock/lessons";
import LessonDetailClient from "./LessonDetailClient";

interface LessonDetailPageProps {
  params: Promise<{ courseId: string; lessonId: string }>;
}

export default async function LessonDetailPage({ params }: LessonDetailPageProps) {
  const { courseId, lessonId } = await params;
  const lesson = lessons.find((l) => l.courseId === courseId && l.id === lessonId);
  const lessonTitle = lesson?.title ?? undefined;
  return (
    <LessonDetailClient
      courseId={courseId}
      lessonId={lessonId}
      lessonTitle={lessonTitle}
    />
  );
}
