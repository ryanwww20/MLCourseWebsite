"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import VideoPlayer from "@/components/VideoPlayer";
import ChatPanel from "@/components/ChatPanel";
import EditLectureButton from "@/components/EditLectureButton";
import type { Lesson } from "@/mock/lessons";
import type { Course } from "@/mock/courses";

const iconImgClass = "w-5 h-5 object-contain opacity-80 hover:opacity-100 transition-opacity";

interface LessonDetailClientProps {
  courseId: string;
  lessonId: string;
  lesson: Lesson;
  course: Course | null;
  relatedLessons: Lesson[];
}

export default function LessonDetailClient({ courseId, lessonId, lesson, course, relatedLessons }: LessonDetailClientProps) {
  const { data: session } = useSession();
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const userId = session?.user?.email ?? null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-[1920px] px-4 py-8 sm:px-6 lg:px-8">
        {/* 桌面：左欄 影片+留言區，右欄 AI 助教；手機：影片 → 留言區 → AI 助教 */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(320px,400px)] lg:grid-rows-[auto_1fr] gap-6 lg:min-h-[calc(100vh-8rem)]">
          {/* 影片區（左上） */}
          <div className="lg:pr-2">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h1 className="text-2xl font-bold text-foreground">課程影片</h1>
              <EditLectureButton lesson={lesson} />
            </div>
            <div className="aspect-video">
              <VideoPlayer src={lesson.videoLink ?? lesson.youtubeLink} onTimeUpdate={setCurrentVideoTime} />
            </div>

            {/* Lecture 資訊區（影片下方、留言區上方） */}
            <section className="mt-4 rounded-lg bg-surface p-4 sm:p-5 text-foreground">
              <h2 className="text-lg font-semibold text-foreground mb-4">本講資訊</h2>
              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-muted-foreground">標題</dt>
                  <dd className="font-medium">{lesson.title}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">週次</dt>
                  <dd>第 {lesson.week} 週</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">日期</dt>
                  <dd>{lesson.date}</dd>
                </div>
              </dl>
              {(lesson.youtubeLink || lesson.pptLink || lesson.pdfLink) && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">教材連結</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {lesson.youtubeLink && (
                      <a
                        href={lesson.youtubeLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded hover:bg-foreground/10"
                        aria-label="YouTube"
                      >
                        <img src="/icons/icon-youtube.png" alt="" className={iconImgClass} width={20} height={20} />
                      </a>
                    )}
                    {lesson.pptLink && (
                      <a
                        href={lesson.pptLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded hover:bg-foreground/10"
                        aria-label="PPT"
                      >
                        <img src="/icons/icon-ppt.png" alt="" className={iconImgClass} width={20} height={20} />
                      </a>
                    )}
                    {lesson.pdfLink && (
                      <a
                        href={lesson.pdfLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded hover:bg-foreground/10"
                        aria-label="PDF"
                      >
                        <img src="/icons/icon-pdf.png" alt="" className={iconImgClass} width={20} height={20} />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* 相關課程連結（admin 可編輯，無資料時留白） */}
              <div className="mt-5 pt-4 border-t border-border">
                <h3 className="text-sm font-semibold text-foreground mb-2">相關課程連結</h3>
                {lesson.relatedCourseLinks && lesson.relatedCourseLinks.length > 0 ? (
                  <ul className="space-y-1">
                    {lesson.relatedCourseLinks.map((link, i) => (
                      <li key={i}>
                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          {link.label || link.url}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">尚無相關課程連結</p>
                )}
              </div>
            </section>
          </div>

          {/* 留言區（左下、影片下方；手機版在影片與 AI 助教之間） */}
          <div className="flex flex-col min-h-[400px] lg:min-h-0">
            <h2 className="text-lg font-semibold text-foreground mb-3">留言區</h2>
            <div className="flex-1 min-h-0">
              <ChatPanel
                courseId={courseId}
                lessonId={lessonId}
                lessonTitle={lesson.title}
                currentVideoTime={currentVideoTime}
                userId={userId}
                mode="comments"
              />
            </div>
          </div>

          {/* AI 助教（右側，桌面時跨兩行與影片+留言區同高） */}
          <div className="flex flex-col min-h-[400px] lg:min-h-0 lg:col-start-2 lg:row-start-1 lg:row-span-2">
            <div className="flex-1 min-h-0">
              <ChatPanel
                courseId={courseId}
                lessonId={lessonId}
                lessonTitle={lesson.title}
                currentVideoTime={currentVideoTime}
                userId={userId}
                mode="chat"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
