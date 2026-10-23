import React, { useState } from 'react';
import { 
  Youtube, 
  Search, 
  Play, 
  ExternalLink, 
  ShieldCheck, 
  Tv, 
  Sparkles, 
  PlusCircle, 
  Film 
} from './Icons';

export default function YouTubeWatchView({
  currentTrack,
  isPlaying,
  onPlayTrack,
  onAddYouTubeTrack
}) {
  const [inputUrl, setInputUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');

  const featuredYouTubeVideos = [
    {
      id: 'yt-v1',
      title: 'Gratitude (Live) - Brandon Lake',
      artist: 'Brandon Lake',
      youtubeId: 'dQ3Cj8-7M3Y',
      duration: 338,
      sourceType: 'youtube',
      coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
      category: 'worship'
    },
    {
      id: 'yt-v2',
      title: 'Oceans (Where Feet May Fail) - Hillsong UNITED',
      artist: 'Hillsong UNITED',
      youtubeId: '6XX7d_jX6Z8',
      duration: 536,
      sourceType: 'youtube',
      coverUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
      category: 'peace'
    },
    {
      id: 'yt-v3',
      title: 'Goodness of God (Live) - CeCe Winans',
      artist: 'CeCe Winans',
      youtubeId: '9sE5kEnitqE',
      duration: 298,
      sourceType: 'youtube',
      coverUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=600&q=80',
      category: 'worship'
    },
    {
      id: 'yt-v4',
      title: 'House of the Lord - Phil Wickham',
      artist: 'Phil Wickham',
      youtubeId: 'x0vQyN3jQbg',
      duration: 255,
      sourceType: 'youtube',
      coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80',
      category: 'joy'
    },
    {
      id: 'yt-v5',
      title: 'Way Maker - Leeland (Official Live)',
      artist: 'Leeland',
      youtubeId: 'iJCV_2H9xD0',
      duration: 320,
      sourceType: 'youtube',
      coverUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=600&q=80',
      category: 'worship'
    },
    {
      id: 'yt-v6',
      title: 'The Blessing - Kari Jobe & Cody Carnes',
      artist: 'Elevation Worship',
      youtubeId: 'Zp6aygmvzM4',
      duration: 322,
      sourceType: 'youtube',
      coverUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=600&q=80',
      category: 'worship'
    }
  ];

  // Helper to extract video ID from YouTube link or ID
  const extractVideoId = (input) => {
    if (!input) return null;
    const match = input.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? match[1] : input.trim();
  };

  const handleLoadCustomVideo = (e) => {
    e.preventDefault();
    const vidId = extractVideoId(inputUrl);
    if (!vidId) {
      alert('Please enter a valid YouTube video URL or 11-character video ID.');
      return;
    }

    const newTrack = {
      id: `yt-custom-${Date.now()}`,
      title: videoTitle || `YouTube Video (${vidId})`,
      artist: 'YouTube Creator',
      album: 'YouTube Watch',
      duration: 300,
      category: 'youtube',
      sourceType: 'youtube',
      youtubeId: vidId,
      coverUrl: `https://img.youtube.com/vi/${vidId}/hqdefault.jpg`,
      lyrics: `[Streaming directly from YouTube: ${vidId}]`
    };

    onAddYouTubeTrack(newTrack);
    onPlayTrack(newTrack);
    setInputUrl('');
    setVideoTitle('');
  };

  return (
    <div className="view-container youtube-view">
      <div className="view-header-row">
        <div>
          <div className="heading-with-icon">
            <Youtube size={28} className="text-red" />
            <h1 className="view-heading">YouTube Watch & Video Theatre</h1>
          </div>
          <p className="view-subtitle">
            Watch official music videos and live worship sessions directly inside the player
          </p>
        </div>

        <div className="compliance-pill">
          <ShieldCheck size={16} className="text-emerald" />
          <span>Play Store & YouTube API Compliant</span>
        </div>
      </div>

      {/* Main Video Theatre Screen */}
      <div className="youtube-theater-container glass-panel">
        <div className="video-viewport-wrapper">
          {currentTrack && currentTrack.sourceType === 'youtube' ? (
            <div className="active-video-container">
              <iframe
                id="main-youtube-iframe"
                src={`https://www.youtube-nocookie.com/embed/${currentTrack.youtubeId}?autoplay=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`}
                title={currentTrack.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="yt-iframe-main"
              ></iframe>
            </div>
          ) : (
            <div className="video-idle-screen">
              <Tv size={56} className="idle-tv-icon" />
              <h3>Select a YouTube Video to Watch</h3>
              <p>Choose from our curated inspirational list below or paste any YouTube URL</p>
            </div>
          )}
        </div>

        {currentTrack && currentTrack.sourceType === 'youtube' && (
          <div className="theater-track-details">
            <div className="theater-text">
              <h2>{currentTrack.title}</h2>
              <p>{currentTrack.artist} • Official YouTube Stream</p>
            </div>
            <a 
              href={`https://www.youtube.com/watch?v=${currentTrack.youtubeId}`} 
              target="_blank" 
              rel="noreferrer"
              className="open-in-yt-link"
            >
              <span>Watch on YouTube.com</span>
              <ExternalLink size={14} />
            </a>
          </div>
        )}
      </div>

      {/* Input Any YouTube Link */}
      <section className="yt-input-card glass-panel">
        <div className="input-card-header">
          <Film size={20} className="text-gold" />
          <h3>Load Any YouTube Video by Link or ID</h3>
        </div>
        <form onSubmit={handleLoadCustomVideo} className="yt-input-form">
          <div className="input-group flex-2">
            <input 
              type="text"
              placeholder="Paste YouTube Link or Video ID (e.g., https://youtu.be/... or dQ3Cj8-7M3Y)"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              className="yt-text-input"
            />
          </div>
          <div className="input-group flex-1">
            <input 
              type="text"
              placeholder="Optional Song Title"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              className="yt-text-input"
            />
          </div>
          <button type="submit" className="play-yt-submit-btn gold-glow">
            <Play size={16} fill="currentColor" />
            <span>Watch Now</span>
          </button>
        </form>
      </section>

      {/* Curated YouTube Video Grid */}
      <section className="curated-yt-section">
        <div className="section-header-row">
          <h2 className="section-heading">Featured YouTube Music Videos</h2>
          <span className="count-label">High Definition Official Releases</span>
        </div>

        <div className="yt-video-grid">
          {featuredYouTubeVideos.map(video => {
            const isCurrent = currentTrack?.youtubeId === video.youtubeId;
            return (
              <div 
                key={video.id}
                className={`yt-video-card glass-panel ${isCurrent ? 'video-active' : ''}`}
                onClick={() => onPlayTrack(video)}
              >
                <div className="yt-thumb-wrap">
                  <img src={video.coverUrl} alt={video.title} className="yt-card-thumb" />
                  <div className="yt-overlay-play">
                    <div className="yt-play-btn-circle">
                      <Play size={20} fill="#ffffff" color="#ffffff" style={{ marginLeft: 2 }} />
                    </div>
                  </div>
                  <span className="yt-badge-tag">
                    <Youtube size={12} fill="#ef4444" color="#ef4444" /> YouTube
                  </span>
                </div>

                <div className="yt-card-info">
                  <h4 className="yt-card-title">{video.title}</h4>
                  <p className="yt-card-artist">{video.artist}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
