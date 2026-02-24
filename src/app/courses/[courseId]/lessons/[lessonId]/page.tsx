import LessonDetailClient from "./LessonDetailClient";

interface LessonDetailPageProps {
  params: Promise<{ courseId: string; lessonId: string }>;
}

export default async function LessonDetailPage({ params }: LessonDetailPageProps) {
  const { courseId, lessonId } = await params;
  return <LessonDetailClient courseId={courseId} lessonId={lessonId} />;
}
