"use client";

import { useState, use } from "react";
import Navbar from "@/components/Navbar";
import VideoPlayer from "@/components/VideoPlayer";
import ChatPanel from "@/components/ChatPanel";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

interface LessonDetailPageProps {
  params: Promise<{
    courseId: string;
    lessonId: string;
  }>;
}

export default function LessonDetailPage({ params }: LessonDetailPageProps) {
  const { courseId, lessonId } = use(params);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-[1920px] px-4 py-8 sm:px-6 lg:px-8">
        {/* Mobile: Stack layout */}
        <div className="lg:hidden space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">課程影片</h1>
            <VideoPlayer onTimeUpdate={setCurrentVideoTime} />
          </div>
          <div className="h-[600px]">
            <ChatPanel courseId={courseId} currentVideoTime={currentVideoTime} />
          </div>
        </div>

        {/* Desktop: Side-by-side with resizable panels */}
        <div className="hidden lg:block h-[calc(100vh-8rem)]">
          <PanelGroup direction="horizontal" className="h-full">
            {/* Video Player - 70% */}
            <Panel defaultSize={70} minSize={30} className="pr-4">
              <div className="h-full flex flex-col">
                <div className="mb-4">
                  <h1 className="text-2xl font-bold text-gray-900">課程影片</h1>
                </div>
                <div className="flex-1 flex items-center">
                  <VideoPlayer onTimeUpdate={setCurrentVideoTime} />
                </div>
              </div>
            </Panel>

            {/* Resize Handle */}
            <PanelResizeHandle className="w-2 bg-gray-200 hover:bg-gray-300 transition-colors cursor-col-resize" />

            {/* Chat Panel - 30% */}
            <Panel defaultSize={30} minSize={20} className="pl-4">
              <div className="h-full">
                <ChatPanel courseId={courseId} currentVideoTime={currentVideoTime} />
              </div>
            </Panel>
          </PanelGroup>
        </div>
      </main>
    </div>
  );
}

