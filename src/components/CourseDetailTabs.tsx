"use client";

import { useState } from "react";
import LessonList from "@/components/LessonList";
import HomeworkList from "@/components/HomeworkList";
import { Lesson } from "@/mock/lessons";
import { Homework } from "@/mock/homework";

interface CourseDetailTabsProps {
  courseId: string;
  lessons: Lesson[];
  homework: Homework[];
}

export default function CourseDetailTabs({ courseId, lessons, homework }: CourseDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<"lectures" | "homework">("lectures");

  return (
    <div className="rounded-2xl shadow-md bg-surface border border-border p-6">
      <div className="border-b border-border mb-6">
        <nav className="flex gap-8" aria-label="Course sections">
          <button
            type="button"
            onClick={() => setActiveTab("lectures")}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "lectures"
                ? "border-foreground text-foreground font-bold"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            Lectures
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("homework")}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "homework"
                ? "border-foreground text-foreground font-bold"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            Homework
          </button>
        </nav>
      </div>

      {activeTab === "lectures" && (
        <>
          {lessons.length > 0 ? (
            <LessonList lessons={lessons} courseId={courseId} />
          ) : (
            <p className="text-muted text-center py-8">尚無課程章節</p>
          )}
        </>
      )}

      {activeTab === "homework" && (
        <>
          {homework.length > 0 ? (
            <HomeworkList homework={homework} />
          ) : (
            <p className="text-muted text-center py-8">尚無作業</p>
          )}
        </>
      )}
    </div>
  );
}
