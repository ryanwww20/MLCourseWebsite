import Navbar from "@/components/Navbar";
import CourseDetailTabs from "@/components/CourseDetailTabs";
import { courses } from "@/mock/courses";
import { lessons } from "@/mock/lessons";
import { notFound } from "next/navigation";

interface CourseDetailPageProps {
  params: Promise<{
    courseId: string;
  }>;
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { courseId } = await params;
  const course = courses.find((c) => c.id === courseId);
  const courseLessons = lessons.filter((l) => l.courseId === courseId);

  if (!course) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="lg:col-span-2">
          <CourseDetailTabs courseId={course.id} lessons={courseLessons} />
        </div>
      </main>
    </div>
  );
}

