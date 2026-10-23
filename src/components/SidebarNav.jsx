import React from 'react';
import { Home, Library, Youtube, Sparkles, Sliders, ShieldCheck, Heart, FolderPlus } from './Icons';

export default function SidebarNav({ activeTab, setActiveTab, libraryCount, favoritesCount }) {
  const navItems = [
    { id: 'home', label: 'Home & Daily', icon: Home, badge: null },
    { id: 'library', label: 'Local Library', icon: Library, badge: libraryCount > 0 ? libraryCount : null },
    { id: 'youtube', label: 'YouTube Watch', icon: Youtube, badge: 'Live' },
    { id: 'ai', label: 'AI Music Finder', icon: Sparkles, badge: 'AI' },
    { id: 'equalizer', label: 'EQ & Settings', icon: Sliders, badge: null },
  ];

  return (
    <aside className="sidebar-nav glass-panel">
      <div className="sidebar-section">
        <span className="sidebar-title">MENU</span>
        <div className="nav-items-list">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              >
                <div className="item-icon-container">
                  <IconComponent size={20} className="sidebar-icon" />
                  {isActive && <div className="active-glow-dot"></div>}
                </div>
                <span className="item-label">{item.label}</span>
                {item.badge && (
                  <span className={`item-badge ${item.badge === 'Live' ? 'badge-red' : item.badge === 'AI' ? 'badge-gold' : 'badge-subtle'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="sidebar-section">
        <span className="sidebar-title">MY PLAYLISTS</span>
        <div className="playlists-quick-list">
          <button className="playlist-quick-item" onClick={() => setActiveTab('library')}>
            <Heart size={16} className="text-gold" />
            <span>Liked Songs ({favoritesCount})</span>
          </button>
          <button className="playlist-quick-item" onClick={() => setActiveTab('home')}>
            <span className="playlist-dot">🕊️</span>
            <span>Sunday Morning Praise</span>
          </button>
          <button className="playlist-quick-item" onClick={() => setActiveTab('ai')}>
            <span className="playlist-dot">☕</span>
            <span>Focus & Scripture Lo-Fi</span>
          </button>
        </div>
      </div>

      <div className="sidebar-compliance-badge">
        <ShieldCheck size={16} className="compliance-icon" />
        <div className="compliance-text">
          <strong>Play Store & ToS Compliant</strong>
          <small>Official YouTube Player API</small>
        </div>
      </div>
    </aside>
  );
}
