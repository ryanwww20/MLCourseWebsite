"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import VideoPlayer from "@/components/VideoPlayer";
import ChatPanel from "@/components/ChatPanel";

interface LessonDetailClientProps {
  courseId: string;
  lessonId: string;
}

export default function LessonDetailClient({ courseId, lessonId }: LessonDetailClientProps) {
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
            <h1 className="text-2xl font-bold text-foreground mb-4">課程影片</h1>
            <div className="aspect-video">
              <VideoPlayer onTimeUpdate={setCurrentVideoTime} />
            </div>
          </div>

          {/* 留言區（左下、影片下方；手機版在影片與 AI 助教之間） */}
          <div className="flex flex-col min-h-[400px] lg:min-h-0">
            <h2 className="text-lg font-semibold text-foreground mb-3">留言區</h2>
            <div className="flex-1 min-h-0">
              <ChatPanel
                courseId={courseId}
                lessonId={lessonId}
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
