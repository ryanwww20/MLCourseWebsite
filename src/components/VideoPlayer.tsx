"use client";

import { useRef, useEffect, useState } from "react";

/** 判斷是否為 YouTube 網址並回傳 video id，否則回傳 null */
function getYoutubeVideoId(url: string): string | null {
  if (!url?.trim()) return null;
  try {
    const u = url.trim();
    if (u.includes("youtube.com/watch?v=")) {
      const m = u.match(/[?&]v=([^&]+)/);
      return m ? m[1] : null;
    }
    if (u.includes("youtu.be/")) {
      const m = u.match(/youtu\.be\/([^?&]+)/);
      return m ? m[1] : null;
    }
    if (u.includes("youtube.com/embed/")) {
      const m = u.match(/embed\/([^?&]+)/);
      return m ? m[1] : null;
    }
    return null;
  } catch {
    return null;
  }
}

const DEFAULT_SAMPLE_VIDEO = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

interface VideoPlayerProps {
  /** 影片連結：YouTube 網址會用 iframe 嵌入，一般直連（如 .mp4）用 <video> 播放；未提供則播預設範例 */
  src?: string | null;
  onTimeUpdate?: (currentTime: number) => void;
}

export default function VideoPlayer({ src, onTimeUpdate }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);

  const youtubeId = src ? getYoutubeVideoId(src) : null;
  const directUrl = src && !youtubeId ? src : null;
  const fallbackUrl = !youtubeId && !directUrl ? DEFAULT_SAMPLE_VIDEO : null;
  const videoSrc = directUrl ?? fallbackUrl ?? "";

  useEffect(() => {
    const video = videoRef.current;
    if (!video || youtubeId) return;

    const handleTimeUpdate = () => {
      const time = video.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => video.removeEventListener("timeupdate", handleTimeUpdate);
  }, [onTimeUpdate, youtubeId]);

  if (youtubeId) {
    return (
      <div className="w-full bg-black rounded-lg overflow-hidden aspect-video">
        <iframe
          className="w-full h-full"
          src={`https://www.youtube.com/embed/${youtubeId}`}
          title="YouTube 課程影片"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="w-full bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        className="w-full h-auto"
        controls
        src={videoSrc || undefined}
      >
        您的瀏覽器不支援影片播放。
      </video>
    </div>
  );
}

