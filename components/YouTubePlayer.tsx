"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
    FaPlay,
    FaPause,
    FaVolumeUp,
    FaVolumeMute,
    FaExpand,
    FaCompress,
} from "react-icons/fa";

declare global {
    interface Window {
        YT: any;
        onYouTubeIframeAPIReady: () => void;
    }
}

interface YouTubePlayerProps {
    videoId: string;
    className?: string;
    onEnded?: () => void;
    onPlay?: () => void;
    onPause?: () => void;
}

export default function YouTubePlayer({
    videoId,
    className = "",
    onEnded,
    onPlay,
    onPause,
}: YouTubePlayerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<any>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showControls, setShowControls] = useState(true);
    const [isReady, setIsReady] = useState(false);
    const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null);

    // Load YouTube IFrame API
    useEffect(() => {
        if (!window.YT) {
            const tag = document.createElement("script");
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName("script")[0];
            firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
        }

        const initPlayer = () => {
            if (playerRef.current) {
                playerRef.current.destroy();
            }

            playerRef.current = new window.YT.Player(`yt-player-${videoId}`, {
                videoId: videoId,
                playerVars: {
                    controls: 0, // Hide default controls
                    modestbranding: 1,
                    rel: 0,
                    showinfo: 0,
                    fs: 0, // Disable fullscreen button (we handle it)
                    iv_load_policy: 3, // Hide annotations
                    disablekb: 1, // Disable keyboard controls (we handle them)
                },
                events: {
                    onReady: (event: any) => {
                        setIsReady(true);
                        setDuration(event.target.getDuration());
                    },
                    onStateChange: (event: any) => {
                        if (event.data === window.YT.PlayerState.PLAYING) {
                            setIsPlaying(true);
                            onPlay?.();
                        } else if (event.data === window.YT.PlayerState.PAUSED) {
                            setIsPlaying(false);
                            onPause?.();
                        } else if (event.data === window.YT.PlayerState.ENDED) {
                            setIsPlaying(false);
                            onEnded?.();
                        }
                    },
                },
            });
        };

        if (window.YT && window.YT.Player) {
            initPlayer();
        } else {
            window.onYouTubeIframeAPIReady = initPlayer;
        }

        return () => {
            if (playerRef.current) {
                playerRef.current.destroy();
            }
        };
    }, [videoId, onEnded, onPlay, onPause]);

    // Update current time
    useEffect(() => {
        const interval = setInterval(() => {
            if (playerRef.current && isReady && isPlaying) {
                setCurrentTime(playerRef.current.getCurrentTime());
            }
        }, 500);

        return () => clearInterval(interval);
    }, [isReady, isPlaying]);

    // Auto-hide controls
    const resetHideControlsTimer = useCallback(() => {
        setShowControls(true);
        if (hideControlsTimeout.current) {
            clearTimeout(hideControlsTimeout.current);
        }
        hideControlsTimeout.current = setTimeout(() => {
            if (isPlaying) {
                setShowControls(false);
            }
        }, 3000);
    }, [isPlaying]);

    useEffect(() => {
        return () => {
            if (hideControlsTimeout.current) {
                clearTimeout(hideControlsTimeout.current);
            }
        };
    }, []);

    // Fullscreen listener
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () => {
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
        };
    }, []);

    const togglePlay = () => {
        if (!playerRef.current) return;
        if (isPlaying) {
            playerRef.current.pauseVideo();
        } else {
            playerRef.current.playVideo();
        }
    };

    const toggleMute = () => {
        if (!playerRef.current) return;
        if (isMuted) {
            playerRef.current.unMute();
        } else {
            playerRef.current.mute();
        }
        setIsMuted(!isMuted);
    };

    const toggleFullscreen = () => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        if (playerRef.current) {
            playerRef.current.seekTo(time, true);
            setCurrentTime(time);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <div
            ref={containerRef}
            className={`relative w-full h-full bg-black ${className}`}
            onMouseMove={resetHideControlsTimer}
            onMouseEnter={() => setShowControls(true)}
        >
            {/* YouTube Player */}
            <div
                id={`yt-player-${videoId}`}
                className="w-full h-full"
            />

            {/* Custom Controls Overlay */}
            <div
                className={`absolute inset-0 flex flex-col justify-end transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"
                    }`}
                onClick={togglePlay}
            >
                {/* Gradient overlay for controls visibility */}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

                {/* Controls bar */}
                <div
                    className="relative z-10 px-4 pb-4 pt-2"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Progress bar */}
                    <div className="mb-3">
                        <input
                            type="range"
                            min={0}
                            max={duration || 100}
                            value={currentTime}
                            onChange={handleSeek}
                            className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>

                    {/* Control buttons */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            {/* Play/Pause */}
                            <button
                                onClick={togglePlay}
                                className="text-white hover:text-blue-400 transition-colors"
                            >
                                {isPlaying ? <FaPause size={20} /> : <FaPlay size={20} />}
                            </button>

                            {/* Mute */}
                            <button
                                onClick={toggleMute}
                                className="text-white hover:text-blue-400 transition-colors"
                            >
                                {isMuted ? <FaVolumeMute size={20} /> : <FaVolumeUp size={20} />}
                            </button>

                            {/* Time display */}
                            <span className="text-white text-sm">
                                {formatTime(currentTime)} / {formatTime(duration)}
                            </span>
                        </div>

                        <div className="flex items-center space-x-4">
                            {/* Fullscreen */}
                            <button
                                onClick={toggleFullscreen}
                                className="text-white hover:text-blue-400 transition-colors"
                            >
                                {isFullscreen ? <FaCompress size={20} /> : <FaExpand size={20} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Logo Overlay */}
            <div className="absolute top-3 right-3 z-20 pointer-events-none">
                <img
                    src="/logo.png"
                    alt="Platform Logo"
                    className="w-16 h-16 object-contain select-none"
                />
            </div>

            {/* Center Play Button (when paused) */}
            {isReady && !isPlaying && (
                <div
                    className="absolute inset-0 flex items-center justify-center cursor-pointer"
                    onClick={togglePlay}
                >
                    <div className="bg-blue-600/80 rounded-full p-6 hover:bg-blue-500/90 transition-colors">
                        <FaPlay size={32} className="text-white ml-1" />
                    </div>
                </div>
            )}
        </div>
    );
}
