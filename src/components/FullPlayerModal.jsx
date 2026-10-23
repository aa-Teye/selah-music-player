import React, { useState } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Shuffle, 
  Repeat, 
  Heart, 
  Volume2, 
  VolumeX, 
  FileText, 
  ListMusic, 
  Sliders, 
  Sparkles,
  Share2
} from 'lucide-react';

function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export default function FullPlayerModal({
  isOpen,
  onClose,
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
  visualizerData = [],
  queue = [],
  onSelectTrackFromQueue,
  onOpenEqualizer
}) {
  const [activeTab, setActiveTab] = useState('visualizer'); // 'visualizer', 'lyrics', 'queue'
  const [copiedShare, setCopiedShare] = useState(false);

  if (!isOpen || !currentTrack) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleShare = () => {
    const text = `Listening to "${currentTrack.title}" by ${currentTrack.artist} on Muzio Spirit!`;
    navigator.clipboard?.writeText(text);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  return (
    <div className="full-player-overlay">
      <div className="full-player-bg" style={{ backgroundImage: `url(${currentTrack.coverUrl})` }}></div>
      <div className="full-player-backdrop"></div>

      <div className="full-player-container">
        {/* Header */}
        <div className="full-player-header">
          <button className="icon-circle-btn" onClick={onClose} title="Minimize Player">
            <X size={22} />
          </button>

          <div className="full-header-tabs">
            <button 
              className={`tab-pill ${activeTab === 'visualizer' ? 'active' : ''}`}
              onClick={() => setActiveTab('visualizer')}
            >
              Player
            </button>
            <button 
              className={`tab-pill ${activeTab === 'lyrics' ? 'active' : ''}`}
              onClick={() => setActiveTab('lyrics')}
            >
              <FileText size={14} style={{ marginRight: 4 }} />
              Lyrics & Scripture
            </button>
            <button 
              className={`tab-pill ${activeTab === 'queue' ? 'active' : ''}`}
              onClick={() => setActiveTab('queue')}
            >
              <ListMusic size={14} style={{ marginRight: 4 }} />
              Queue ({queue.length})
            </button>
          </div>

          <div className="header-actions">
            <button className="icon-circle-btn" onClick={handleShare} title="Share track">
              <Share2 size={18} />
              {copiedShare && <span className="copied-tooltip">Copied!</span>}
            </button>
            <button className="icon-circle-btn" onClick={onOpenEqualizer} title="Equalizer">
              <Sliders size={18} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="full-player-body">
          {activeTab === 'visualizer' && (
            <div className="visualizer-content">
              {/* Spinning Vinyl & Art */}
              <div className={`vinyl-disc-large ${isPlaying ? 'spinning' : 'paused'}`}>
                <div className="vinyl-grooves"></div>
                <img 
                  src={currentTrack.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80'} 
                  alt={currentTrack.title}
                  className="vinyl-center-art" 
                />
                <div className="vinyl-hole"></div>
              </div>

              {/* Dynamic Sound Wave Visualizer Bars */}
              <div className="visualizer-bars-row">
                {(visualizerData.length > 0 ? visualizerData.slice(0, 32) : [12, 28, 45, 60, 30, 80, 50, 90, 40, 70, 25, 65, 35, 85, 45, 95, 40, 60, 30, 50, 70, 40, 90, 60, 30, 80, 50, 30, 60, 40, 20, 10]).map((val, idx) => {
                  const height = isPlaying ? Math.max(8, (val / 255) * 60) : 6;
                  return (
                    <div 
                      key={idx} 
                      className="visualizer-bar"
                      style={{ 
                        height: `${height}px`,
                        backgroundColor: idx % 3 === 0 ? '#e5a93c' : idx % 2 === 0 ? '#fcd34d' : 'rgba(255,255,255,0.4)'
                      }}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'lyrics' && (
            <div className="lyrics-content glass-panel">
              <div className="lyrics-header">
                <h3>{currentTrack.title}</h3>
                <p>{currentTrack.artist} • {currentTrack.album || 'Single'}</p>
              </div>
              <div className="lyrics-body">
                {currentTrack.lyrics ? (
                  currentTrack.lyrics.split('\n').map((line, idx) => (
                    <p key={idx} className={line.startsWith('[') ? 'lyric-section' : 'lyric-line'}>
                      {line}
                    </p>
                  ))
                ) : (
                  <p className="no-lyrics">No synchronized lyrics available for this track.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'queue' && (
            <div className="queue-content glass-panel">
              <h3 className="queue-title">Up Next</h3>
              <div className="queue-list">
                {queue.map((item, index) => (
                  <div 
                    key={item.id || index}
                    className={`queue-item ${item.id === currentTrack.id ? 'current-queue-item' : ''}`}
                    onClick={() => onSelectTrackFromQueue(item)}
                  >
                    <span className="queue-index">{index + 1}</span>
                    <img src={item.coverUrl} alt={item.title} className="queue-thumb" />
                    <div className="queue-info">
                      <span className="queue-item-title">{item.title}</span>
                      <span className="queue-item-artist">{item.artist}</span>
                    </div>
                    {item.id === currentTrack.id && (
                      <span className="now-playing-pill">NOW PLAYING</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Control Section */}
        <div className="full-player-controls-footer">
          <div className="full-track-meta">
            <div className="meta-info">
              <h2>{currentTrack.title}</h2>
              <p>{currentTrack.artist}</p>
            </div>
            <button 
              className={`fav-btn-large ${isFavorite ? 'active' : ''}`}
              onClick={() => onToggleFavorite(currentTrack.id)}
            >
              <Heart size={24} fill={isFavorite ? '#e5a93c' : 'none'} color={isFavorite ? '#e5a93c' : '#9ca3af'} />
            </button>
          </div>

          {/* Time scrubber */}
          <div className="full-scrubber-row">
            <span className="time-label">{formatTime(currentTime)}</span>
            <div 
              className="scrubber-track"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const ratio = Math.max(0, Math.min(1, clickX / rect.width));
                onSeek(ratio * duration);
              }}
            >
              <div className="scrubber-fill" style={{ width: `${progressPercent}%` }}>
                <div className="scrubber-thumb"></div>
              </div>
            </div>
            <span className="time-label">{formatTime(duration)}</span>
          </div>

          {/* Large buttons */}
          <div className="full-controls-row">
            <button 
              className={`ctrl-btn-round ${isShuffle ? 'active-gold' : ''}`}
              onClick={onToggleShuffle}
              title="Shuffle"
            >
              <Shuffle size={20} />
            </button>

            <button className="ctrl-btn-round" onClick={onPrev} title="Previous">
              <SkipBack size={26} />
            </button>

            <button 
              className="ctrl-btn-play gold-glow" 
              onClick={onTogglePlay}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={30} fill="currentColor" /> : <Play size={30} fill="currentColor" style={{ marginLeft: 3 }} />}
            </button>

            <button className="ctrl-btn-round" onClick={onNext} title="Next">
              <SkipForward size={26} />
            </button>

            <button 
              className={`ctrl-btn-round ${isRepeat ? 'active-gold' : ''}`}
              onClick={onToggleRepeat}
              title="Repeat"
            >
              <Repeat size={20} />
            </button>
          </div>

          {/* Volume control */}
          <div className="full-volume-row">
            <button className="vol-btn" onClick={onToggleMute}>
              {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <input 
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={(e) => onChangeVolume(Number(e.target.value))}
              className="volume-slider full-vol"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
