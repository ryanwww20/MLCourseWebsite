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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左側：課程資訊卡片 */}
            <div className="lg:col-span-1">
              <div className="rounded-2xl shadow-md bg-surface border border-border p-6 sticky top-8">
                <h1 className="text-2xl font-bold text-foreground mb-4">{course.name}</h1>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-muted">學期</span>
                    <p className="text-foreground font-medium">{course.semester}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted">教師</span>
                    <p className="text-foreground font-medium">{course.instructor}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted">簡介</span>
                    <p className="text-foreground mt-1 text-sm">{course.description}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted mb-2 block">標籤</span>
                    <div className="flex flex-wrap gap-2">
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
                </div>
              </div>
            </div>
            {/* 右側：Lectures / Homework 卡片 */}
            <div className="lg:col-span-2">
              <CourseDetailTabs courseId={course.id} lessons={courseLessons} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

