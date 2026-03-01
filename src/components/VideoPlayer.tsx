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

const YT_SCRIPT_URL = "https://www.youtube.com/iframe_api";
const YT_POLL_INTERVAL_MS = 500;

/** 簡化型別：YouTube IFrame API 的 Player（僅用到的部分） */
interface YTPlayer {
  getCurrentTime: () => number;
}

declare global {
  interface Window {
    YT?: { Player: new (el: HTMLElement | string, opts: { videoId: string; width?: string; height?: string }) => YTPlayer };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface VideoPlayerProps {
  /** 影片連結：YouTube 網址會用 iframe 嵌入，一般直連（如 .mp4）用 <video> 播放；未提供則播預設範例 */
  src?: string | null;
  onTimeUpdate?: (currentTime: number) => void;
}

export default function VideoPlayer({ src, onTimeUpdate }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const youtubeContainerRef = useRef<HTMLDivElement>(null);
  const youtubePlayerRef = useRef<YTPlayer | null>(null);
  const [ytReady, setYtReady] = useState(false);

  const youtubeId = src ? getYoutubeVideoId(src) : null;
  const directUrl = src && !youtubeId ? src : null;
  const fallbackUrl = !youtubeId && !directUrl ? DEFAULT_SAMPLE_VIDEO : null;
  const videoSrc = directUrl ?? fallbackUrl ?? "";

  // 原生 <video> 的時間回報
  useEffect(() => {
    const video = videoRef.current;
    if (!video || youtubeId) return;

    const handleTimeUpdate = () => {
      const time = video.currentTime;
      onTimeUpdate?.(time);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => video.removeEventListener("timeupdate", handleTimeUpdate);
  }, [onTimeUpdate, youtubeId]);

  // 載入 YouTube IFrame API（僅在需要 YouTube 時）
  useEffect(() => {
    if (!youtubeId) return;
    if (typeof window === "undefined") return;

    if (window.YT?.Player) {
      setYtReady(true);
      return;
    }

    const existing = document.querySelector(`script[src="${YT_SCRIPT_URL}"]`);
    if (existing) {
      const check = setInterval(() => {
        if (window.YT?.Player) {
          setYtReady(true);
          clearInterval(check);
        }
      }, 100);
      return () => clearInterval(check);
    }

    const script = document.createElement("script");
    script.src = YT_SCRIPT_URL;
    script.async = true;
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      setYtReady(true);
      prev?.();
    };
    document.head.appendChild(script);
    return () => {
      window.onYouTubeIframeAPIReady = prev;
    };
  }, [youtubeId]);

  // 建立 YouTube Player 並輪詢 getCurrentTime，回報給 onTimeUpdate
  useEffect(() => {
    if (!youtubeId || !ytReady || typeof window === "undefined" || !window.YT?.Player) return;
    const container = youtubeContainerRef.current;
    if (!container) return;

    youtubePlayerRef.current = null;
    const player = new window.YT.Player(container, {
      videoId: youtubeId,
      width: "100%",
      height: "100%",
    });
    youtubePlayerRef.current = player;

    const interval = setInterval(() => {
      try {
        const t = player.getCurrentTime?.();
        if (typeof t === "number" && Number.isFinite(t)) {
          onTimeUpdate?.(t);
        }
      } catch {
        // ignore
      }
    }, YT_POLL_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      youtubePlayerRef.current = null;
    };
  }, [youtubeId, ytReady, onTimeUpdate]);

  if (youtubeId) {
    return (
      <div className="relative w-full bg-black rounded-lg overflow-hidden aspect-video">
        <div
          key={youtubeId}
          ref={youtubeContainerRef}
          className="w-full h-full"
          style={{ minHeight: 200 }}
        />
        {!ytReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black text-white/80 text-sm">
            載入 YouTube 播放器…
          </div>
        )}
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

