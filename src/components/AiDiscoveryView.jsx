import React, { useState } from 'react';
import { 
  Sparkles, 
  Search, 
  Play, 
  Youtube, 
  ListPlus, 
  Bot, 
  Compass, 
  Flame, 
  CheckCircle,
  Lightbulb
} from './Icons';
import { CURATED_RECOMMENDATIONS } from '../data/mockData';

export default function AiDiscoveryView({
  onPlayTrack,
  onAddToQueue,
  currentTrack
}) {
  const [prompt, setPrompt] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [recommendationResults, setRecommendationResults] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const samplePrompts = [
    { label: "Peaceful Acoustic Worship for Anxiety", icon: "🕊️" },
    { label: "High-Energy Uplifting Workout Praise", icon: "⚡" },
    { label: "Study & Scripture Contemplation Lo-Fi", icon: "☕" },
    { label: "Deep Psalm 23 Meditation Piano", icon: "📖" },
    { label: "Sunday Choir Celebration & Joy", icon: "🙌" }
  ];

  // AI-Powered search simulation
  const handleRunAiSearch = (customQuery) => {
    const queryToUse = customQuery || prompt;
    if (!queryToUse.trim()) return;

    setIsSearching(true);
    setPrompt(queryToUse);

    setTimeout(() => {
      // Generate intelligent match based on query keywords
      const lower = queryToUse.toLowerCase();
      let match = null;

      if (lower.includes('peace') || lower.includes('anxiety') || lower.includes('calm') || lower.includes('acoustic')) {
        match = {
          theme: 'Peace, Calming & Healing Grace',
          aiSummary: 'Based on your search for tranquil and comforting soundscapes, the AI model selected peaceful acoustic melodies and soothing harmonies known to reduce stress and foster spiritual stillness.',
          tracks: [
            {
              id: 'ai-1',
              title: 'Oceans (Where Feet May Fail)',
              artist: 'Hillsong UNITED',
              youtubeId: '6XX7d_jX6Z8',
              duration: 536,
              genre: 'Acoustic Worship',
              sourceType: 'youtube',
              coverUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
              reason: 'Lyrically centers on stepping beyond fears into supernatural peace.'
            },
            {
              id: 'ai-2',
              title: 'Goodness of God',
              artist: 'CeCe Winans',
              youtubeId: '9sE5kEnitqE',
              duration: 298,
              genre: 'Soulful Praise',
              sourceType: 'youtube',
              coverUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=600&q=80',
              reason: 'Reassuring vocal delivery highlighting faithfulness through hardships.'
            },
            {
              id: 'ai-3',
              title: 'Gentle Rain & Piano Hymns',
              artist: 'Quiet Streams',
              youtubeId: '5qap5aO4i9A',
              duration: 220,
              genre: 'Ambient Instrumentals',
              sourceType: 'youtube',
              coverUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=600&q=80',
              reason: 'Minimalist ambient piano ideal for prayer, deep breathing, and sleep.'
            }
          ]
        };
      } else if (lower.includes('energy') || lower.includes('workout') || lower.includes('joy') || lower.includes('upbeat')) {
        match = {
          theme: 'High Energy & Joyful Celebration',
          aiSummary: 'Selected vibrant rhythms, uplifting brass, and driving tempos designed to energize physical workouts, morning routines, and joyous celebrations.',
          tracks: [
            {
              id: 'ai-4',
              title: 'House of the Lord',
              artist: 'Phil Wickham',
              youtubeId: 'x0vQyN3jQbg',
              duration: 255,
              genre: 'Upbeat Praise',
              sourceType: 'youtube',
              coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80',
              reason: '120 BPM driving tempo with celebratory drums and joyous hooks.'
            },
            {
              id: 'ai-5',
              title: 'Way Maker (Live)',
              artist: 'Leeland / Sinach',
              youtubeId: 'iJCV_2H9xD0',
              duration: 320,
              genre: 'Anthem Rock',
              sourceType: 'youtube',
              coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
              reason: 'Powerful crescendos that build momentum and motivation.'
            }
          ]
        };
      } else {
        match = {
          theme: `Curated Discoveries for: "${queryToUse}"`,
          aiSummary: `AI discovery engine searched YouTube music catalogs and synthesized the most relevant inspirational tracks matching your custom prompt.`,
          tracks: [
            {
              id: 'ai-gen-1',
              title: 'The Blessing (Live Elevation Worship)',
              artist: 'Kari Jobe & Cody Carnes',
              youtubeId: 'Zp6aygmvzM4',
              duration: 322,
              genre: 'Worship Anthem',
              sourceType: 'youtube',
              coverUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=600&q=80',
              reason: 'Biblical Aaron blessing song adapted for modern melodic clarity.'
            },
            {
              id: 'ai-gen-2',
              title: 'Lo-Fi Worship & Study Beats',
              artist: 'Sunday Chill Sessions',
              youtubeId: 'jfKfPfyJRdk',
              duration: 245,
              genre: 'Lo-Fi Scripture Chill',
              sourceType: 'youtube',
              coverUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=600&q=80',
              reason: 'Subtle basslines and tape saturation warmth for steady focus.'
            },
            {
              id: 'ai-gen-3',
              title: 'Gratitude (Live)',
              artist: 'Brandon Lake',
              youtubeId: 'dQ3Cj8-7M3Y',
              duration: 338,
              genre: 'Contemporary Praise',
              sourceType: 'youtube',
              coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
              reason: 'Soul-stirring acoustic build-up to an explosive vocal chorus.'
            }
          ]
        };
      }

      setRecommendationResults(match);
      setIsSearching(false);
    }, 600);
  };

  return (
    <div className="view-container ai-discovery-view">
      {/* Hero AI Search Section */}
      <div className="ai-hero-card glass-panel">
        <div className="ai-badge-row">
          <div className="ai-badge gold-glow">
            <Sparkles size={16} className="text-gold" />
            <span>AI MUSIC DISCOVERY & SEARCH</span>
          </div>
          <span className="ai-powered-by">Powered by Intelligent Music Models</span>
        </div>

        <h1 className="ai-hero-title">
          Find the Perfect Track for Any <span className="gold-text">Mood, Prayer, or Vibe</span>
        </h1>
        <p className="ai-hero-subtitle">
          Describe the feeling, scripture, or genre you want, and let the AI curate high-quality YouTube music recommendations.
        </p>

        {/* Search Input Bar */}
        <form 
          className="ai-search-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleRunAiSearch();
          }}
        >
          <div className="ai-input-wrap">
            <Bot size={20} className="ai-bot-icon" />
            <input 
              type="text" 
              placeholder="e.g. Peaceful acoustic gospel songs for morning prayer and peace..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="ai-text-input"
            />
          </div>
          <button 
            type="submit" 
            className="ai-search-submit-btn gold-glow"
            disabled={isSearching}
          >
            {isSearching ? (
              <span className="searching-spinner">Analyzing...</span>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Ask AI</span>
              </>
            )}
          </button>
        </form>

        {/* Suggested Prompts */}
        <div className="sample-prompts-row">
          <span className="sample-label">
            <Lightbulb size={14} className="text-gold" /> Quick Prompts:
          </span>
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              className="sample-prompt-pill"
              onClick={() => handleRunAiSearch(p.label)}
            >
              <span>{p.icon}</span>
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* AI Recommendation Results Section */}
      {recommendationResults && (
        <section className="ai-results-section">
          <div className="ai-results-header glass-panel">
            <div className="ai-result-title-col">
              <span className="result-tag">AI ANALYSIS RESULT</span>
              <h2>{recommendationResults.theme}</h2>
              <p className="ai-reasoning-paragraph">{recommendationResults.aiSummary}</p>
            </div>
          </div>

          <div className="ai-tracks-grid">
            {recommendationResults.tracks.map((track) => {
              const isCurrent = currentTrack?.youtubeId === track.youtubeId;
              return (
                <div 
                  key={track.id} 
                  className={`ai-track-card glass-panel ${isCurrent ? 'playing-card' : ''}`}
                >
                  <div className="ai-track-thumb-row">
                    <img src={track.coverUrl} alt={track.title} className="ai-track-cover" />
                    <div className="ai-track-info">
                      <h4 className="ai-track-title">{track.title}</h4>
                      <p className="ai-track-artist">{track.artist}</p>
                      <span className="genre-badge">{track.genre}</span>
                    </div>
                  </div>

                  <div className="ai-why-recommend">
                    <span className="why-label">AI Insight:</span>
                    <p>{track.reason}</p>
                  </div>

                  <div className="ai-card-actions">
                    <button 
                      className="play-now-btn gold-glow"
                      onClick={() => onPlayTrack(track)}
                    >
                      <Play size={16} fill="currentColor" />
                      <span>Play on YouTube</span>
                    </button>

                    <button 
                      className="add-queue-btn"
                      onClick={() => onAddToQueue(track)}
                      title="Add to Player Queue"
                    >
                      <ListPlus size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Curated Pre-built Mood Collections */}
      <section className="prebuilt-collections-section">
        <div className="section-header-row">
          <h2 className="section-heading">Curated AI Spiritual Collections</h2>
          <span className="count-label">Handcrafted algorithms</span>
        </div>

        <div className="collections-grid">
          {CURATED_RECOMMENDATIONS.map((cat, idx) => (
            <div 
              key={idx}
              className="collection-card glass-panel"
              onClick={() => handleRunAiSearch(cat.query)}
            >
              <div className="collection-icon-badge">
                <Compass size={22} className="text-gold" />
              </div>
              <h3>{cat.query}</h3>
              <span className="collection-mood-tag">{cat.mood}</span>
              <p className="collection-track-count">{cat.tracks.length} recommended songs</p>
              <span className="explore-link">Explore with AI →</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
