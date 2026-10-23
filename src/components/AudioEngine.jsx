import React, { useEffect, useRef } from 'react';

export default function AudioEngine({
  currentTrack,
  isPlaying,
  setIsPlaying,
  volume,
  currentTime,
  setCurrentTime,
  duration,
  setDuration,
  onTrackEnded,
  isMuted,
  audioRef,
  onVisualizerData
}) {
  const ytPlayerRef = useRef(null);
  const ytContainerRef = useRef(null);
  const timeIntervalRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Initialize Web Audio API Analyser for local audio
  useEffect(() => {
    if (!audioRef.current) return;

    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          audioContextRef.current = ctx;
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 64;
          analyserRef.current = analyser;

          const source = ctx.createMediaElementSource(audioRef.current);
          source.connect(analyser);
          analyser.connect(ctx.destination);
        }
      }
    } catch (err) {
      // AudioContext already connected or cross-origin
    }
  }, [audioRef]);

  // Visualizer loop
  useEffect(() => {
    const updateVisualizer = () => {
      if (analyserRef.current && onVisualizerData && isPlaying) {
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);
        onVisualizerData(Array.from(dataArray));
      }
      animationFrameRef.current = requestAnimationFrame(updateVisualizer);
    };

    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updateVisualizer);
    } else {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    }

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, onVisualizerData]);

  // Sync Local Audio element
  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;
    audio.volume = isMuted ? 0 : volume / 100;

    if (currentTrack && currentTrack.sourceType === 'local') {
      if (audio.src !== currentTrack.audioUrl) {
        audio.src = currentTrack.audioUrl;
        audio.load();
      }

      if (isPlaying) {
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume();
        }
        audio.play().catch(e => console.log('Audio autoplay prevented:', e));
      } else {
        audio.pause();
      }
    } else {
      audio.pause();
    }
  }, [currentTrack, isPlaying, volume, isMuted, audioRef]);

  // YouTube IFrame API Loader
  useEffect(() => {
    // Check if YT script is loaded
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    window.onYouTubeIframeAPIReady = () => {
      initYouTubePlayer();
    };

    if (window.YT && window.YT.Player) {
      initYouTubePlayer();
    }

    function initYouTubePlayer() {
      if (ytPlayerRef.current) return;
      if (!document.getElementById('yt-player-slot')) return;

      ytPlayerRef.current = new window.YT.Player('yt-player-slot', {
        height: '100%',
        width: '100%',
        videoId: currentTrack?.youtubeId || 'dQ3Cj8-7M3Y',
        playerVars: {
          autoplay: 0,
          controls: 1,
          rel: 0,
          modestbranding: 1,
          enablejsapi: 1,
          origin: window.location.origin
        },
        events: {
          onReady: (event) => {
            event.target.setVolume(isMuted ? 0 : volume);
            if (currentTrack?.duration) {
              setDuration(currentTrack.duration);
            }
          },
          onStateChange: (event) => {
            // YT.PlayerState: 1 = PLAYING, 2 = PAUSED, 0 = ENDED
            if (event.data === 1) {
              setIsPlaying(true);
              startTimer();
            } else if (event.data === 2) {
              setIsPlaying(false);
              stopTimer();
            } else if (event.data === 0) {
              setIsPlaying(false);
              stopTimer();
              if (onTrackEnded) onTrackEnded();
            }
          }
        }
      });
    }

    function startTimer() {
      stopTimer();
      timeIntervalRef.current = setInterval(() => {
        if (ytPlayerRef.current && ytPlayerRef.current.getCurrentTime) {
          try {
            const current = ytPlayerRef.current.getCurrentTime();
            const dur = ytPlayerRef.current.getDuration();
            if (dur && dur > 0) setDuration(dur);
            setCurrentTime(current);
          } catch (e) {
            // Player not ready
          }
        }
      }, 500);
    }

    function stopTimer() {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
        timeIntervalRef.current = null;
      }
    }

    return () => {
      stopTimer();
    };
  }, []);

  // When current track changes for YouTube
  useEffect(() => {
    if (currentTrack && currentTrack.sourceType === 'youtube' && ytPlayerRef.current && ytPlayerRef.current.loadVideoById) {
      try {
        ytPlayerRef.current.loadVideoById(currentTrack.youtubeId);
        if (isPlaying) {
          ytPlayerRef.current.playVideo();
        } else {
          ytPlayerRef.current.pauseVideo();
        }
      } catch (err) {
        console.error('Error changing YT video:', err);
      }
    }
  }, [currentTrack]);

  // Handle Play/Pause synchronization with YouTube
  useEffect(() => {
    if (currentTrack && currentTrack.sourceType === 'youtube' && ytPlayerRef.current && ytPlayerRef.current.playVideo) {
      try {
        if (isPlaying) {
          ytPlayerRef.current.playVideo();
        } else {
          ytPlayerRef.current.pauseVideo();
        }
      } catch (e) {}
    }
  }, [isPlaying]);

  // Handle Volume change on YouTube
  useEffect(() => {
    if (ytPlayerRef.current && ytPlayerRef.current.setVolume) {
      try {
        ytPlayerRef.current.setVolume(isMuted ? 0 : volume);
      } catch (e) {}
    }
  }, [volume, isMuted]);

  const handleAudioTimeUpdate = () => {
    if (audioRef.current && currentTrack?.sourceType === 'local') {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  return (
    <>
      {/* HTML5 Audio element for local files */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleAudioTimeUpdate}
        onLoadedMetadata={handleAudioTimeUpdate}
        onEnded={onTrackEnded}
      />

      {/* Floating or embedded YouTube player container */}
      <div 
        ref={ytContainerRef}
        className={`yt-embed-slot ${currentTrack?.sourceType === 'youtube' ? 'active-yt' : 'idle-yt'}`}
      >
        <div id="yt-player-slot"></div>
      </div>
    </>
  );
}
