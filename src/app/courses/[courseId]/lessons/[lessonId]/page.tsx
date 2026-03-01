import LessonDetailClient from "./LessonDetailClient";
import { getLessons } from "@/lib/data";
import { notFound } from "next/navigation";

interface LessonDetailPageProps {
  params: Promise<{ courseId: string; lessonId: string }>;
}

export default async function LessonDetailPage({ params }: LessonDetailPageProps) {
  const { courseId, lessonId } = await params;
  const lessons = getLessons();
  const lesson = lessons.find((l) => l.id === lessonId && l.courseId === courseId);
  if (!lesson) notFound();
  return <LessonDetailClient courseId={courseId} lessonId={lessonId} lesson={lesson} />;
}
