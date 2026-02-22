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
    <div className="min-h-screen flex flex-col">
      {/* 上層深色背景（約 256px），Navbar 區用淺色字 */}
      <div className="h-[var(--top-bg-height)] shrink-0 bg-top-bg">
        <Navbar />
      </div>
      {/* 下層淺色背景 */}
      <div className="flex-1 bg-background">
        {/* 主內容區：用 negative margin 往上拉，浮在兩層交界 */}
        <div className="relative -mt-32 mx-auto max-w-6xl px-4 sm:px-6 pb-12">
          {/* 右側：Lectures / Homework 卡片 */}
          <div className="lg:col-span-2">
            <CourseDetailTabs courseId={course.id} lessons={courseLessons} />
          </div>
        </div>
      </div>
    </div>
  );
}

