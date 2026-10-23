import React from 'react';
import { 
  Play, 
  Flame, 
  Sparkles, 
  Share2, 
  Bookmark, 
  Clock, 
  TrendingUp, 
  Youtube, 
  Compass, 
  Music,
  Plus
} from './Icons';

export default function HomeView({
  devotion,
  tracks,
  currentTrack,
  isPlaying,
  onPlayTrack,
  activeMood,
  setActiveMood,
  moodTags,
  onOpenAiDiscovery,
  onNavigateToTab
}) {
  const filteredTracks = activeMood === 'all' 
    ? tracks 
    : tracks.filter(t => t.category === activeMood);

  const featuredTrack = tracks.find(t => t.id === 'yt-1') || tracks[0];

  return (
    <div className="view-container home-view">
      {/* YouVersion-Inspired Verse & Devotion of the Day Card */}
      <section className="devotion-hero-card glass-panel">
        <div className="devotion-badge-row">
          <div className="devotion-pill">
            <Sparkles size={14} className="text-gold" />
            <span>VERSE OF THE DAY</span>
          </div>
          <div className="devotion-streak-pill">
            <Flame size={14} className="text-orange" />
            <span>Day {devotion.streakDays} Streak</span>
          </div>
        </div>

        <blockquote className="devotion-quote">
          {devotion.verse}
        </blockquote>

        <div className="devotion-reference-row">
          <span className="devotion-ref">— {devotion.reference}</span>
          <p className="devotion-reflection">{devotion.reflection}</p>
        </div>

        <div className="devotion-actions-row">
          <button 
            className="play-featured-btn gold-glow"
            onClick={() => onPlayTrack(featuredTrack)}
          >
            <Play size={18} fill="currentColor" />
            <span>Play Devotional Anthem</span>
          </button>

          <button 
            className="action-pill-btn"
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(`${devotion.verse} — ${devotion.reference}`);
                alert("Verse copied to clipboard!");
              }
            }}
          >
            <Share2 size={16} />
            <span>Share Verse</span>
          </button>

          <button 
            className="action-pill-btn"
            onClick={onOpenAiDiscovery}
          >
            <Sparkles size={16} />
            <span>AI Prayer & Music</span>
          </button>
        </div>
      </section>

      {/* Mood & Category Pills */}
      <section className="mood-pills-section">
        <div className="section-header-row">
          <h2 className="section-heading">Mood & Atmosphere</h2>
          <span className="section-subheading">Select your spiritual or focus vibe</span>
        </div>
        <div className="mood-pills-scroll">
          {moodTags.map(tag => (
            <button
              key={tag.id}
              className={`mood-pill ${activeMood === tag.id ? 'active' : ''}`}
              onClick={() => setActiveMood(tag.id)}
            >
              <span className="pill-icon">{tag.icon}</span>
              <span className="pill-text">{tag.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Featured Songs Grid */}
      <section className="tracks-grid-section">
        <div className="section-header-row">
          <div className="heading-with-icon">
            <TrendingUp size={20} className="text-gold" />
            <h2 className="section-heading">Featured Melodies</h2>
          </div>
          <span className="count-label">{filteredTracks.length} tracks available</span>
        </div>

        <div className="songs-cards-grid">
          {filteredTracks.map(track => {
            const isCurrent = currentTrack?.id === track.id;
            return (
              <div 
                key={track.id}
                className={`song-card glass-panel ${isCurrent ? 'card-playing' : ''}`}
                onClick={() => onPlayTrack(track)}
              >
                <div className="song-card-thumb-wrap">
                  <img src={track.coverUrl} alt={track.title} className="song-card-img" />
                  <div className="card-play-overlay">
                    <button className="card-play-circle gold-glow">
                      {isCurrent && isPlaying ? (
                        <div className="mini-equalizer-bars">
                          <span></span><span></span><span></span>
                        </div>
                      ) : (
                        <Play size={20} fill="currentColor" style={{ marginLeft: 2 }} />
                      )}
                    </button>
                  </div>
                  {track.sourceType === 'youtube' && (
                    <span className="yt-card-badge">
                      <Youtube size={12} /> YouTube
                    </span>
                  )}
                </div>

                <div className="song-card-details">
                  <h3 className="song-card-title">{track.title}</h3>
                  <p className="song-card-artist">{track.artist}</p>
                  <div className="card-meta-row">
                    <span className="category-pill">{track.category}</span>
                    <span className="track-duration-pill">
                      <Clock size={11} style={{ marginRight: 3 }} />
                      {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Quick shortcuts banner */}
      <section className="quick-banner-grid">
        <div 
          className="quick-action-card glass-panel local-card"
          onClick={() => onNavigateToTab('library')}
        >
          <div className="quick-card-icon">
            <Music size={24} />
          </div>
          <div className="quick-card-info">
            <h3>Add Local Music (.mp3 / .wav)</h3>
            <p>Import songs from your computer into Muzio player</p>
          </div>
          <Plus size={20} className="quick-arrow" />
        </div>

        <div 
          className="quick-action-card glass-panel yt-card"
          onClick={() => onNavigateToTab('youtube')}
        >
          <div className="quick-card-icon yt-icon-box">
            <Youtube size={24} />
          </div>
          <div className="quick-card-info">
            <h3>Watch YouTube Videos</h3>
            <p>100% compliant video & audio playback with lyrics</p>
          </div>
          <Compass size={20} className="quick-arrow" />
        </div>
      </section>
    </div>
  );
}
