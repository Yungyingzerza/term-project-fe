"use client";
import { useEffect, useRef, useState } from "react";
import {
  PauseIcon,
  PlayIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
} from "@heroicons/react/24/outline";

export default function VideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playPauseRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [progressBar, setProgressBar] = useState(0);
  const [isHoveringProgress, setIsHoveringProgress] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [targetTime, setTargetTime] = useState(0);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Helper function to format time in MM:SS format
  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleVideoClick = () => {
    if (videoRef.current && playPauseRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);

      playPauseRef.current.style.transition =
        "opacity 0s ease, transform 0s ease";
      playPauseRef.current.style.opacity = "1";
      playPauseRef.current.style.transform = "scale(0.75)";
      void playPauseRef.current.offsetHeight; // trigger reflow
      setTimeout(() => {
        if (playPauseRef.current) {
          playPauseRef.current.style.transition =
            "opacity 0.3s ease, transform 0.3s ease";
          playPauseRef.current.style.opacity = "0";
          playPauseRef.current.style.transform = "scale(1)";
        }
      }, 200); // Show icon for 200ms before fading
    }
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted, videoRef]);

  //auto update progress
  useEffect(() => {
    const updateProgress = () => {
      if (videoRef.current && !isDragging) {
        const { currentTime, duration } = videoRef.current;
        setCurrentTime(currentTime);
        setDuration(duration);
        setProgressBar((currentTime / duration) * 100);
      }
    };

    const handleLoadedMetadata = () => {
      if (videoRef.current) {
        setDuration(videoRef.current.duration);
      }
    };

    videoRef.current?.addEventListener("timeupdate", updateProgress);
    videoRef.current?.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      videoRef.current?.removeEventListener("timeupdate", updateProgress);
      videoRef.current?.removeEventListener(
        "loadedmetadata",
        handleLoadedMetadata
      );
    };
  }, [videoRef, isDragging]);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressBarRef.current && videoRef.current) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = (clickX / rect.width) * 100;
      const newTime = (percentage / 100) * videoRef.current.duration;

      videoRef.current.currentTime = newTime;
      setProgressBar(percentage);
    }
  };

  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleProgressClick(e);
  };

  const handleProgressMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging && progressBarRef.current && videoRef.current) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = Math.max(
        0,
        Math.min(100, (clickX / rect.width) * 100)
      );
      const newTime = (percentage / 100) * videoRef.current.duration;

      videoRef.current.currentTime = newTime;
      setProgressBar(percentage);
      setTargetTime(newTime);
    }
  };

  const handleProgressMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging && progressBarRef.current && videoRef.current) {
        const rect = progressBarRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = Math.max(
          0,
          Math.min(100, (clickX / rect.width) * 100)
        );
        const newTime = (percentage / 100) * videoRef.current.duration;

        videoRef.current.currentTime = newTime;
        setProgressBar(percentage);
        setTargetTime(newTime);
      }
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleGlobalMouseMove);
      document.addEventListener("mouseup", handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isDragging]);

  return (
    <>
      <div className="relative w-fit h-full">
        {/* Play/Pause Icon */}
        <div
          ref={playPauseRef}
          className="text-primary absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 scale-100"
        >
          <div className="bg-base-100 w-20 h-20 rounded-full flex items-center justify-center">
            {!isPlaying ? (
              <PauseIcon className="h-10 w-10" strokeWidth={2} />
            ) : (
              <PlayIcon className="h-10 w-10" strokeWidth={2} />
            )}
          </div>
        </div>

        {/* Speaker Icon */}
        <div
          className="text-primary absolute right-4 top-4 z-10"
          onClick={() => setIsMuted(!isMuted)}
        >
          {isMuted ? (
            <SpeakerXMarkIcon className="h-8 w-8" strokeWidth={2} />
          ) : (
            <SpeakerWaveIcon className="h-8 w-8" strokeWidth={2} />
          )}
        </div>

        {/* Progress Bar */}
        <div
          ref={progressBarRef}
          className={`absolute bottom-0 left-0 right-0 cursor-pointer transition-all duration-200 z-50 ${
            isHoveringProgress || isDragging ? "h-6" : "h-4"
          } bg-tranparent flex items-end`}
          onMouseEnter={() => setIsHoveringProgress(true)}
          onMouseLeave={() => setIsHoveringProgress(false)}
          onMouseDown={handleProgressMouseDown}
          onMouseMove={handleProgressMouseMove}
          onMouseUp={handleProgressMouseUp}
          onClick={handleProgressClick}
        >
          {/* Background Track */}
          <div
            className={`w-full ${
              isHoveringProgress || isDragging ? "h-1" : "h-1"
            } bg-base-300 relative`}
          >
            {/* Progress Fill */}
            <div
              className="h-full bg-primary relative"
              style={{ width: `${progressBar}%` }}
            >
              {/* Progress Circle */}
              {(isHoveringProgress || isDragging) && (
                <div
                  className="absolute top-1/2 -right-2 w-4 h-4 bg-primary rounded-full shadow-lg cursor-grab active:cursor-grabbing border-2 border-white"
                  style={{
                    transform: "translateY(-50%)",
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Time Display */}
        {(isHoveringProgress || isDragging) && (
          <div className="absolute bottom-8 left-4 text-white bg-black bg-opacity-50 px-2 py-1 rounded text-sm">
            {isDragging ? (
              <span>
                {formatTime(targetTime)} / {formatTime(duration)}
              </span>
            ) : (
              <span>
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            )}
          </div>
        )}

        <video
          className="max-h-screen h-full"
          ref={videoRef}
          onClick={handleVideoClick}
          onKeyUp={(e) => console.log(e)}
          autoPlay={true}
          loop={true}
          muted={true}
        >
          <source src="./test.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    </>
  );
}
