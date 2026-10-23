import React from 'react';
import { Flame, Search, Bell, Sparkles, Compass } from 'lucide-react';

export default function TopNavbar({ 
  searchQuery, 
  setSearchQuery, 
  streakDays, 
  activeMood, 
  setActiveMood, 
  moodTags,
  onOpenAiDiscovery 
}) {
  return (
    <header className="top-navbar glass-panel">
      <div className="nav-left">
        <div className="brand-logo">
          <div className="logo-icon-wrap">
            <span className="logo-wave"></span>
            <span className="logo-wave"></span>
            <span className="logo-wave"></span>
          </div>
          <div className="brand-text">
            <span className="brand-title">MUZIO<span className="gold-text">SPIRIT</span></span>
            <span className="brand-sub">Windows & Mobile Music</span>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="search-bar-wrap">
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search tracks, artists, scriptures, or YouTube..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => setSearchQuery('')}>×</button>
          )}
        </div>
      </div>

      <div className="nav-right">
        {/* YouVersion Daily Streak Badge */}
        <div className="streak-badge" title="Daily Listening & Prayer Streak">
          <Flame size={18} className="flame-icon anim-pulse" />
          <span className="streak-count">{streakDays}</span>
          <span className="streak-label">DAYS</span>
        </div>

        {/* AI Quick Discovery Button */}
        <button 
          className="ai-discovery-btn"
          onClick={onOpenAiDiscovery}
          title="Ask AI for Music Recommendations"
        >
          <Sparkles size={16} className="sparkle-icon" />
          <span>AI Search</span>
        </button>

        {/* User profile avatar */}
        <div className="user-profile-badge">
          <div className="avatar-ring">
            <img 
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80" 
              alt="Profile" 
              className="user-avatar"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
