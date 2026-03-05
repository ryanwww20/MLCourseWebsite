"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import VideoPlayer from "@/components/VideoPlayer";
import ChatPanel from "@/components/ChatPanel";
import EditLectureButton from "@/components/EditLectureButton";
import type { Lesson } from "@/mock/lessons";
import type { Course } from "@/mock/courses";

const iconImgClass = "w-5 h-5 object-contain opacity-80 hover:opacity-100 transition-opacity";

/** Base path for static assets; use /course when under that path so icons load in client bundle */
function useIconBase() {
  if (typeof window === "undefined") return process.env.NEXT_PUBLIC_BASE_PATH ?? "/course";
  return window.location.pathname.startsWith("/course") ? "/course" : (process.env.NEXT_PUBLIC_BASE_PATH ?? "");
}

interface LessonDetailClientProps {
  courseId: string;
  lessonId: string;
  lesson: Lesson;
  course: Course | null;
  relatedLessons: Lesson[];
}

function HelpIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  );
}

export default function LessonDetailClient({ courseId, lessonId, lesson, course, relatedLessons }: LessonDetailClientProps) {
  const { data: session } = useSession();
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);
  const userId = session?.user?.id ?? session?.user?.email ?? null;
  const iconBase = useIconBase();

  const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  const { prevLesson, nextLesson } = useMemo(() => {
    const all = [lesson, ...relatedLessons].sort((a, b) => a.week - b.week || a.id.localeCompare(b.id));
    const idx = all.findIndex((l) => l.id === lesson.id);
    return {
      prevLesson: idx > 0 ? all[idx - 1] : null,
      nextLesson: idx < all.length - 1 ? all[idx + 1] : null,
    };
  }, [lesson, relatedLessons]);

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 min-h-0 mx-auto w-full max-w-[1920px] px-4 py-4 sm:px-6 lg:px-8 lg:pb-4">
        {/* 桌面：左欄 影片+留言區，右欄 AI 助教；手機：影片 → 留言區 → AI 助教 */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(320px,400px)] gap-6 h-full">
          {/* 影片＋資訊＋留言（左欄，桌面可獨立捲動） */}
          <div className="lg:overflow-y-auto lg:pr-2 lg:min-h-0">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">課程影片</h1>
                <button
                  type="button"
                  onClick={() => setHelpOpen(true)}
                  className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-colors"
                  aria-label="頁面功能說明"
                >
                  <HelpIcon className="w-5 h-5" />
                </button>
              </div>
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
                        <img src={`${iconBase}/icons/icon-youtube.png`} alt="" className={iconImgClass} width={20} height={20} />
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
                        <img src={`${iconBase}/icons/icon-ppt.png`} alt="" className={iconImgClass} width={20} height={20} />
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
                        <img src={`${iconBase}/icons/icon-pdf.png`} alt="" className={iconImgClass} width={20} height={20} />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Extra Material */}
              {lesson.extraMaterials && lesson.extraMaterials.length > 0 && (
                <div className="mt-5 pt-4 border-t border-border">
                  <h3 className="text-sm font-semibold text-foreground mb-2">Extra Material</h3>
                  <ul className="space-y-1.5">
                    {lesson.extraMaterials.map((mat, i) => (
                      <li key={i} className="flex items-center gap-2">
                        {mat.type === "video" ? (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-muted-foreground flex-shrink-0">
                            <polygon points="23 7 16 12 23 17 23 7" />
                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-muted-foreground flex-shrink-0">
                            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                            <path d="M8 21h8" />
                            <path d="M12 17v4" />
                          </svg>
                        )}
                        <a
                          href={mat.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm truncate"
                        >
                          {mat.title || mat.url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 相關課程連結（admin 可編輯，無資料時留白） */}
              <div className="mt-5 pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-foreground">相關課程連結</h3>
                  <div className="flex items-center gap-2">
                    {prevLesson ? (
                      <Link
                        href={`${BASE_PATH}/courses/${courseId}/lessons/${prevLesson.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md border border-border text-foreground hover:bg-foreground/10 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                          <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                        </svg>
                        上一堂
                      </Link>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md border border-border/50 text-muted-foreground/40 cursor-not-allowed select-none">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                          <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                        </svg>
                        上一堂
                      </span>
                    )}
                    {nextLesson ? (
                      <Link
                        href={`${BASE_PATH}/courses/${courseId}/lessons/${nextLesson.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md border border-border text-foreground hover:bg-foreground/10 transition-colors"
                      >
                        下一堂
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                          <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                        </svg>
                      </Link>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md border border-border/50 text-muted-foreground/40 cursor-not-allowed select-none">
                        下一堂
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                          <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                        </svg>
                      </span>
                    )}
                  </div>
                </div>
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

            {/* 留言區（影片＋資訊下方，同一捲動區域） */}
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-foreground mb-3">留言區</h2>
              <div className="min-h-[300px]">
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
          </div>

          {/* AI 助教（右欄，桌面佔滿高度獨立捲動） */}
          <div className="flex flex-col min-h-[400px] lg:min-h-0">
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

      {/* 頁面功能說明視窗 */}
      {helpOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setHelpOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            aria-label="關閉"
          />
          <div
            className="relative w-full max-w-md rounded-xl border border-border bg-surface shadow-xl p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="page-help-title"
          >
            <h2 id="page-help-title" className="text-lg font-semibold text-foreground mb-3">頁面功能說明</h2>
            <div className="text-sm text-foreground space-y-3">
              <p>本頁可觀看課程影片，並使用下方兩個區塊與課程互動：</p>
              <ul className="list-disc list-inside space-y-1.5 text-muted-foreground">
                <li><strong className="text-foreground">留言區</strong>：公開的討論區，所有人可見你的留言與回覆。</li>
                <li><strong className="text-foreground">聊天室（AI 助教）</strong>：私人對話，僅你自己可見，可針對影片內容向 AI 提問。</li>
              </ul>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                className="px-4 py-2 bg-foreground text-background rounded-lg hover:opacity-90"
              >
                知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
