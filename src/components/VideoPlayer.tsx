"use client";

import { useRef, useEffect, useState } from "react";

/** YouTube 影片 id 為 11 字元（英數字與 -_），非此格式會讓 iframe 無法播放，視為無效 */
function isValidYoutubeVideoId(id: string): boolean {
  return /^[A-Za-z0-9_-]{11}$/.test(id);
}

/** 判斷是否為 YouTube 網址並回傳 video id，否則回傳 null；無效的 id（如 example2）回傳 null 以改用預設影片 */
function getYoutubeVideoId(url: string): string | null {
  if (!url?.trim()) return null;
  try {
    const u = url.trim();
    let id: string | null = null;
    if (u.includes("youtube.com/watch?v=")) {
      const m = u.match(/[?&]v=([^&]+)/);
      id = m ? m[1] : null;
    } else if (u.includes("youtu.be/")) {
      const m = u.match(/youtu\.be\/([^?&]+)/);
      id = m ? m[1] : null;
    } else if (u.includes("youtube.com/embed/")) {
      const m = u.match(/embed\/([^?&]+)/);
      id = m ? m[1] : null;
    }
    return id && isValidYoutubeVideoId(id) ? id : null;
  } catch {
    return null;
  }
}

const DEFAULT_SAMPLE_VIDEO = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

const YT_SCRIPT_URL = "https://www.youtube.com/iframe_api";
const YT_POLL_MS = 500;

/** 僅在 fallback 時使用（純 iframe、不取時間），避免 API 的 web-share 錯誤 */
const YOUTUBE_IFRAME_ALLOW =
  "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";

interface YTPlayer {
  getCurrentTime?: () => number;
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        el: HTMLElement | string,
        opts: { videoId: string; width?: string; height?: string }
      ) => YTPlayer;
    };
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
  const [ytReady, setYtReady] = useState(false);
  /** API 載入或建立 player 失敗時（如 web-share 錯誤）改回純 iframe，不取時間 */
  const [useFallbackIframe, setUseFallbackIframe] = useState(false);

  const youtubeId = src ? getYoutubeVideoId(src) : null;
  const isYoutubeUrl = (url: string) => /youtube\.com|youtu\.be/.test(url);
  const directUrl = src && !youtubeId && !isYoutubeUrl(src) ? src : null;
  const fallbackUrl = !youtubeId && !directUrl ? DEFAULT_SAMPLE_VIDEO : null;
  const videoSrc = directUrl ?? fallbackUrl ?? "";

  // 原生 <video> 的時間回報
  useEffect(() => {
    const video = videoRef.current;
    if (!video || youtubeId) return;

    const handleTimeUpdate = () => {
      onTimeUpdate?.(video.currentTime);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => video.removeEventListener("timeupdate", handleTimeUpdate);
  }, [onTimeUpdate, youtubeId]);

  // 載入 YouTube IFrame API（僅在 YouTube 且未 fallback 時）
  useEffect(() => {
    if (!youtubeId || useFallbackIframe || typeof window === "undefined") return;

    if (window.YT?.Player) {
      setYtReady(true);
      return;
    }

    const existing = document.querySelector(`script[src="${YT_SCRIPT_URL}"]`);
    if (existing) {
      const t = setInterval(() => {
        if (window.YT?.Player) {
          setYtReady(true);
          clearInterval(t);
        }
      }, 100);
      return () => clearInterval(t);
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
  }, [youtubeId, useFallbackIframe]);

  // 建立 YT.Player 並輪詢 getCurrentTime；失敗則改 fallback
  useEffect(() => {
    if (!youtubeId || !ytReady || useFallbackIframe || typeof window === "undefined" || !window.YT?.Player) return;
    const container = youtubeContainerRef.current;
    if (!container) return;

    let player: YTPlayer | null = null;
    try {
      player = new window.YT.Player(container, {
        videoId: youtubeId,
        width: "100%",
        height: "100%",
      });
    } catch {
      setUseFallbackIframe(true);
      return;
    }

    const interval = setInterval(() => {
      try {
        const t = player?.getCurrentTime?.();
        if (typeof t === "number" && Number.isFinite(t)) {
          onTimeUpdate?.(t);
        }
      } catch {
        setUseFallbackIframe(true);
      }
    }, YT_POLL_MS);

    return () => {
      clearInterval(interval);
    };
  }, [youtubeId, ytReady, useFallbackIframe, onTimeUpdate]);

  // 切換影片時重置 fallback 狀態
  useEffect(() => {
    setUseFallbackIframe(false);
  }, [youtubeId]);

  if (youtubeId) {
    if (useFallbackIframe) {
      return (
        <div className="relative w-full bg-black rounded-lg overflow-hidden aspect-video">
          <iframe
            key={youtubeId}
            src={`https://www.youtube.com/embed/${youtubeId}`}
            title="YouTube 影片"
            allow={YOUTUBE_IFRAME_ALLOW}
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        </div>
      );
    }

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

