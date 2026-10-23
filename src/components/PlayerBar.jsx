import React from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Shuffle, 
  Repeat, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Heart, 
  Youtube, 
  Music,
  ListMusic
} from './Icons';

function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export default function PlayerBar({
  currentTrack,
  isPlaying,
  onTogglePlay,
  onNext,
  onPrev,
  isShuffle,
  onToggleShuffle,
  isRepeat,
  onToggleRepeat,
  currentTime,
  duration,
  onSeek,
  volume,
  onChangeVolume,
  isMuted,
  onToggleMute,
  isFavorite,
  onToggleFavorite,
  onOpenFullPlayer,
  onToggleQueue
}) {
  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <footer className="player-bar glass-panel">
      {/* Top micro progress bar */}
      <div 
        className="progress-bar-container"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const ratio = Math.max(0, Math.min(1, clickX / rect.width));
          onSeek(ratio * duration);
        }}
      >
        <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}>
          <div className="progress-scrubber-handle"></div>
        </div>
      </div>

      <div className="player-inner">
        {/* Track Info */}
        <div className="player-track-info" onClick={onOpenFullPlayer} title="Click to open Full Player">
          <div className={`track-cover-wrap ${isPlaying ? 'playing' : ''}`}>
            <img 
              src={currentTrack.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=150&q=80'} 
              alt={currentTrack.title} 
              className={`track-cover-img ${isPlaying ? 'anim-spin-slow' : 'anim-spin-paused'}`}
            />
            <div className="cover-center-hole"></div>
          </div>
          
          <div className="track-text">
            <div className="track-title-row">
              <span className="track-title">{currentTrack.title}</span>
              {currentTrack.sourceType === 'youtube' ? (
                <span className="source-pill yt-pill"><Youtube size={12} /> YouTube</span>
              ) : (
                <span className="source-pill local-pill"><Music size={12} /> Local</span>
              )}
            </div>
            <span className="track-artist">{currentTrack.artist}</span>
          </div>

          <button 
            className={`fav-btn ${isFavorite ? 'active-fav' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(currentTrack.id);
            }}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart size={18} fill={isFavorite ? '#e5a93c' : 'none'} color={isFavorite ? '#e5a93c' : '#9ca3af'} />
          </button>
        </div>

        {/* Center Playback Controls */}
        <div className="player-controls">
          <div className="controls-row">
            <button 
              className={`ctrl-btn ${isShuffle ? 'active-ctrl' : ''}`}
              onClick={onToggleShuffle}
              title="Shuffle"
            >
              <Shuffle size={17} />
            </button>

            <button 
              className="ctrl-btn"
              onClick={onPrev}
              title="Previous Track"
            >
              <SkipBack size={20} />
            </button>

            <button 
              className="play-pause-btn gold-glow"
              onClick={onTogglePlay}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" style={{ marginLeft: 2 }} />}
            </button>

            <button 
              className="ctrl-btn"
              onClick={onNext}
              title="Next Track"
            >
              <SkipForward size={20} />
            </button>

            <button 
              className={`ctrl-btn ${isRepeat ? 'active-ctrl' : ''}`}
              onClick={onToggleRepeat}
              title="Repeat"
            >
              <Repeat size={17} />
            </button>
          </div>

          <div className="time-display-row">
            <span className="time-text">{formatTime(currentTime)}</span>
            <span className="time-separator">/</span>
            <span className="time-text duration">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right Action Controls: Volume & Expand */}
        <div className="player-right-actions">
          <div className="volume-control-wrap">
            <button className="vol-btn" onClick={onToggleMute} title={isMuted ? 'Unmute' : 'Mute'}>
              {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <input 
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={(e) => onChangeVolume(Number(e.target.value))}
              className="volume-slider"
              title={`Volume: ${isMuted ? 0 : volume}%`}
            />
          </div>

          <button className="action-btn" onClick={onToggleQueue} title="Queue">
            <ListMusic size={18} />
          </button>

          <button className="action-btn expand-btn" onClick={onOpenFullPlayer} title="Full Player & Lyrics">
            <Maximize2 size={18} />
          </button>
        </div>
      </div>
    </footer>
  );
}
