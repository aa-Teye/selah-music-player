import React, { useState, useRef, useEffect } from 'react';
import TopNavbar from './components/TopNavbar';
import SidebarNav from './components/SidebarNav';
import PlayerBar from './components/PlayerBar';
import AudioEngine from './components/AudioEngine';
import FullPlayerModal from './components/FullPlayerModal';
import EqualizerSettingsModal from './components/EqualizerSettingsModal';
import QueueDrawer from './components/QueueDrawer';
import HomeView from './components/HomeView';
import LocalLibraryView from './components/LocalLibraryView';
import YouTubeWatchView from './components/YouTubeWatchView';
import AiDiscoveryView from './components/AiDiscoveryView';

import { DAILY_DEVOTION, INITIAL_TRACKS, MOOD_TAGS } from './data/mockData';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [tracks, setTracks] = useState(INITIAL_TRACKS);
  const [localTracks, setLocalTracks] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(INITIAL_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(INITIAL_TRACKS[0].duration || 180);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [favorites, setFavorites] = useState(['yt-1', 'yt-2']);
  const [queue, setQueue] = useState(INITIAL_TRACKS);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMood, setActiveMood] = useState('all');
  const [streakDays, setStreakDays] = useState(DAILY_DEVOTION.streakDays);

  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState(false);
  const [isEqualizerOpen, setIsEqualizerOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [visualizerData, setVisualizerData] = useState([]);

  const audioRef = useRef(null);

  // Play a specific track
  const handlePlayTrack = (track) => {
    if (!track) return;
    setCurrentTrack(track);
    setIsPlaying(true);
    setCurrentTime(0);
    setDuration(track.duration || 180);

    // If track is not in queue, add it
    if (!queue.some(t => t.id === track.id)) {
      setQueue(prev => [track, ...prev]);
    }
  };

  // Toggle Play / Pause
  const handleTogglePlay = () => {
    setIsPlaying(prev => !prev);
  };

  // Next Track
  const handleNextTrack = () => {
    if (queue.length === 0) return;

    if (isShuffle) {
      const randomIndex = Math.floor(Math.random() * queue.length);
      handlePlayTrack(queue[randomIndex]);
      return;
    }

    const currentIndex = queue.findIndex(t => t.id === currentTrack?.id);
    if (currentIndex !== -1 && currentIndex < queue.length - 1) {
      handlePlayTrack(queue[currentIndex + 1]);
    } else {
      // Loop back to start if repeat is enabled or first item
      handlePlayTrack(queue[0]);
    }
  };

  // Previous Track
  const handlePrevTrack = () => {
    if (currentTime > 4) {
      handleSeek(0);
      return;
    }

    if (queue.length === 0) return;
    const currentIndex = queue.findIndex(t => t.id === currentTrack?.id);
    if (currentIndex > 0) {
      handlePlayTrack(queue[currentIndex - 1]);
    } else {
      handlePlayTrack(queue[queue.length - 1]);
    }
  };

  // Seek
  const handleSeek = (newTime) => {
    setCurrentTime(newTime);
    if (currentTrack?.sourceType === 'local' && audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  // Track Ended Handler
  const handleTrackEnded = () => {
    if (isRepeat) {
      handleSeek(0);
      setIsPlaying(true);
      if (currentTrack?.sourceType === 'local' && audioRef.current) {
        audioRef.current.play();
      }
    } else {
      handleNextTrack();
    }
  };

  // Volume
  const handleChangeVolume = (val) => {
    setVolume(val);
    if (val > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  // Mute
  const handleToggleMute = () => {
    setIsMuted(prev => !prev);
  };

  // Favorite
  const handleToggleFavorite = (trackId) => {
    setFavorites(prev => 
      prev.includes(trackId) 
        ? prev.filter(id => id !== trackId)
        : [...prev, trackId]
    );
  };

  // Add Local Tracks
  const handleAddLocalTracks = (newTracks) => {
    setLocalTracks(prev => [...newTracks, ...prev]);
    setTracks(prev => [...newTracks, ...prev]);
    setQueue(prev => [...prev, ...newTracks]);
    if (!currentTrack) {
      handlePlayTrack(newTracks[0]);
    }
  };

  // Delete Local Track
  const handleDeleteLocalTrack = (trackId) => {
    setLocalTracks(prev => prev.filter(t => t.id !== trackId));
    setTracks(prev => prev.filter(t => t.id !== trackId));
    setQueue(prev => prev.filter(t => t.id !== trackId));
    if (currentTrack?.id === trackId) {
      handleNextTrack();
    }
  };

  // Add YouTube Track
  const handleAddYouTubeTrack = (newTrack) => {
    setTracks(prev => [newTrack, ...prev]);
    setQueue(prev => [newTrack, ...prev]);
  };

  // Add to Queue
  const handleAddToQueue = (track) => {
    setQueue(prev => [...prev, track]);
    alert(`"${track.title}" added to playback queue!`);
  };

  // Remove from Queue
  const handleRemoveFromQueue = (index) => {
    setQueue(prev => prev.filter((_, idx) => idx !== index));
  };

  // Filtered tracks by search
  const visibleTracks = tracks.filter(t => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      (t.category && t.category.toLowerCase().includes(q))
    );
  });

  return (
    <div className="app-layout">
      {/* Hidden Audio and YouTube Engine */}
      <AudioEngine
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        volume={volume}
        currentTime={currentTime}
        setCurrentTime={setCurrentTime}
        duration={duration}
        setDuration={setDuration}
        onTrackEnded={handleTrackEnded}
        isMuted={isMuted}
        audioRef={audioRef}
        onVisualizerData={setVisualizerData}
      />

      {/* Top Navbar */}
      <TopNavbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        streakDays={streakDays}
        activeMood={activeMood}
        setActiveMood={setActiveMood}
        moodTags={MOOD_TAGS}
        onOpenAiDiscovery={() => setActiveTab('ai')}
      />

      {/* Main Workspace (Sidebar + Main Viewport) */}
      <div className="app-main-body">
        <SidebarNav
          activeTab={activeTab}
          setActiveTab={(tab) => {
            if (tab === 'equalizer') {
              setIsEqualizerOpen(true);
            } else {
              setActiveTab(tab);
            }
          }}
          libraryCount={localTracks.length}
          favoritesCount={favorites.length}
        />

        <main className="main-viewport-content">
          {activeTab === 'home' && (
            <HomeView
              devotion={DAILY_DEVOTION}
              tracks={visibleTracks}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onPlayTrack={handlePlayTrack}
              activeMood={activeMood}
              setActiveMood={setActiveMood}
              moodTags={MOOD_TAGS}
              onOpenAiDiscovery={() => setActiveTab('ai')}
              onNavigateToTab={setActiveTab}
            />
          )}

          {activeTab === 'library' && (
            <LocalLibraryView
              localTracks={localTracks}
              onAddLocalTracks={handleAddLocalTracks}
              onPlayTrack={handlePlayTrack}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onDeleteLocalTrack={handleDeleteLocalTrack}
              onAddToQueue={handleAddToQueue}
            />
          )}

          {activeTab === 'youtube' && (
            <YouTubeWatchView
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onPlayTrack={handlePlayTrack}
              onAddYouTubeTrack={handleAddYouTubeTrack}
            />
          )}

          {activeTab === 'ai' && (
            <AiDiscoveryView
              onPlayTrack={handlePlayTrack}
              onAddToQueue={handleAddToQueue}
              currentTrack={currentTrack}
            />
          )}
        </main>
      </div>

      {/* Floating Bottom Player Bar */}
      <PlayerBar
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        onNext={handleNextTrack}
        onPrev={handlePrevTrack}
        isShuffle={isShuffle}
        onToggleShuffle={() => setIsShuffle(prev => !prev)}
        isRepeat={isRepeat}
        onToggleRepeat={() => setIsRepeat(prev => !prev)}
        currentTime={currentTime}
        duration={duration}
        onSeek={handleSeek}
        volume={volume}
        onChangeVolume={handleChangeVolume}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        isFavorite={currentTrack ? favorites.includes(currentTrack.id) : false}
        onToggleFavorite={handleToggleFavorite}
        onOpenFullPlayer={() => setIsFullPlayerOpen(true)}
        onToggleQueue={() => setIsQueueOpen(true)}
      />

      {/* Fullscreen Player Modal */}
      <FullPlayerModal
        isOpen={isFullPlayerOpen}
        onClose={() => setIsFullPlayerOpen(false)}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        onNext={handleNextTrack}
        onPrev={handlePrevTrack}
        isShuffle={isShuffle}
        onToggleShuffle={() => setIsShuffle(prev => !prev)}
        isRepeat={isRepeat}
        onToggleRepeat={() => setIsRepeat(prev => !prev)}
        currentTime={currentTime}
        duration={duration}
        onSeek={handleSeek}
        volume={volume}
        onChangeVolume={handleChangeVolume}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        isFavorite={currentTrack ? favorites.includes(currentTrack.id) : false}
        onToggleFavorite={handleToggleFavorite}
        visualizerData={visualizerData}
        queue={queue}
        onSelectTrackFromQueue={handlePlayTrack}
        onOpenEqualizer={() => setIsEqualizerOpen(true)}
      />

      {/* Equalizer & Play Store Compliance Modal */}
      <EqualizerSettingsModal
        isOpen={isEqualizerOpen}
        onClose={() => setIsEqualizerOpen(false)}
      />

      {/* Slide-out Queue Drawer */}
      <QueueDrawer
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
        queue={queue}
        currentTrack={currentTrack}
        onPlayTrack={handlePlayTrack}
        onRemoveFromQueue={handleRemoveFromQueue}
        onClearQueue={() => setQueue([])}
      />
    </div>
  );
}
