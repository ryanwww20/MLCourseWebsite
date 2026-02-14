import Navbar from "@/components/Navbar";
import LessonList from "@/components/LessonList";
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Course Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{course.name}</h1>
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-gray-500">學期</span>
                  <p className="text-gray-900 font-medium">{course.semester}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">教師</span>
                  <p className="text-gray-900 font-medium">{course.instructor}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">簡介</span>
                  <p className="text-gray-700 mt-1">{course.description}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500 mb-2 block">標籤</span>
                  <div className="flex flex-wrap gap-2">
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
              </div>
            </div>
          </div>

          {/* Right: Lessons List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">課程章節</h2>
              {courseLessons.length > 0 ? (
                <LessonList lessons={courseLessons} courseId={course.id} />
              ) : (
                <p className="text-gray-500 text-center py-8">尚無課程章節</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

