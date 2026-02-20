import Navbar from "@/components/Navbar";
import CourseCard from "@/components/CourseCard";
import { courses } from "@/mock/courses";

export default function CoursesPage() {
  const ongoing = courses.filter((c) => c.status === "ongoing");
  const previous = courses.filter((c) => c.status === "previous");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">課程列表</h1>

        <section className="mb-12">
          <h2 className="text-xl font-semibold text-foreground mb-4">Ongoing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ongoing.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
          {ongoing.length === 0 && (
            <p className="text-muted text-sm">目前沒有進行中的課程。</p>
          )}
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-4">Previous</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {previous.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
          {previous.length === 0 && (
            <p className="text-muted text-sm">目前沒有已結束的課程。</p>
          )}
        </section>
      </main>
    </div>
  );
}

