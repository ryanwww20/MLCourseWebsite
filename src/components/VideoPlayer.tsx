"use client";

import { useRef, useEffect, useState } from "react";

interface VideoPlayerProps {
  onTimeUpdate?: (currentTime: number) => void;
}

export default function VideoPlayer({ onTimeUpdate }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const time = video.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => video.removeEventListener("timeupdate", handleTimeUpdate);
  }, [onTimeUpdate]);

  return (
    <div className="w-full bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        className="w-full h-auto"
        controls
        src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
      >
        您的瀏覽器不支援影片播放。
      </video>
    </div>
  );
}

