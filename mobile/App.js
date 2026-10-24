import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View, SafeAreaView, StatusBar, Alert } from 'react-native';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

import TopHeader from './src/components/TopHeader';
import BottomTabs from './src/components/BottomTabs';
import MiniPlayerBar from './src/components/MiniPlayerBar';
import FullPlayerModal from './src/components/FullPlayerModal';

import HomeScreen from './src/screens/HomeScreen';
import LocalLibraryScreen from './src/screens/LocalLibraryScreen';
import YouTubeWatchScreen from './src/screens/YouTubeWatchScreen';
import PlaylistsScreen from './src/screens/PlaylistsScreen';
import EqualizerScreen from './src/screens/EqualizerScreen';

import { DAILY_DEVOTION, INITIAL_TRACKS, MOOD_TAGS } from './src/data/mockData';
import { StorageService } from './src/services/storageService';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [tracks, setTracks] = useState(INITIAL_TRACKS);
  const [localTracks, setLocalTracks] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(INITIAL_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [duration, setDuration] = useState(INITIAL_TRACKS[0].duration || 180);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [favorites, setFavorites] = useState(['track-1', 'track-2']);
  const [isFullPlayerVisible, setIsFullPlayerVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMood, setActiveMood] = useState('all');
  const [streakData, setStreakData] = useState({ streakDays: 14 });
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState(null);

  const soundRef = useRef(null);
  const statusSubRef = useRef(null);
  const playbackTimer = useRef(null);
  const sleepTimerRef = useRef(null);

  // Initialize native audio & Load persistent state
  useEffect(() => {
    async function initApp() {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: true,
          interruptionMode: 'doNotMix'
        }).catch((err) => console.log('AudioMode configuration notice:', err));

        // Load saved favorites, local tracks, streak from AsyncStorage
        const [savedFavs, savedLocal, savedStreak] = await Promise.all([
          StorageService.getFavorites(),
          StorageService.getLocalTracks(),
          StorageService.recordDailyStreak()
        ]);

        if (savedFavs) setFavorites(savedFavs);
        if (savedStreak) setStreakData(savedStreak);
        if (savedLocal && savedLocal.length > 0) {
          setLocalTracks(savedLocal);
          setTracks((prev) => [...savedLocal, ...prev]);
        }
      } catch (e) {
        console.log('Error initializing app storage:', e);
      }
    }
    initApp();

    return () => {
      if (statusSubRef.current) {
        try {
          statusSubRef.current.remove();
        } catch (_) {}
      }
      if (soundRef.current) {
        try {
          soundRef.current.pause();
          soundRef.current.remove();
        } catch (_) {}
      }
      if (playbackTimer.current) {
        clearInterval(playbackTimer.current);
      }
      if (sleepTimerRef.current) {
        clearInterval(sleepTimerRef.current);
      }
    };
  }, []);

  // Handle Play a Track
  const handlePlayTrack = useCallback(async (track) => {
    if (!track) return;
    setCurrentTrack(track);
    setIsPlaying(true);
    setCurrentPosition(0);
    setDuration(track.duration || 180);

    // Play immediately if audio source exists (bundled asset or streaming/file URI)
    const audioSource = track.asset || track.uri;
    if (audioSource) {
      try {
        if (statusSubRef.current) {
          try {
            statusSubRef.current.remove();
          } catch (_) {}
          statusSubRef.current = null;
        }

        if (soundRef.current) {
          try {
            soundRef.current.pause();
            soundRef.current.remove();
          } catch (_) {}
          soundRef.current = null;
        }

        const player = createAudioPlayer(audioSource);
        soundRef.current = player;
        player.playbackRate = playbackSpeed;
        player.play();

        const sub = player.addListener('playbackStatusUpdate', (status) => {
          if (status.duration && status.duration > 0) {
            setDuration(Math.floor(status.duration));
          }
          if (typeof status.currentTime === 'number') {
            setCurrentPosition(Math.floor(status.currentTime));
          }
          if (status.didJustFinish) {
            handleNextTrack();
          }
        });
        statusSubRef.current = sub;
      } catch (err) {
        console.log('Error playing audio sound:', err);
      }
    }
  }, [playbackSpeed, handleNextTrack]);

  // Next Track
  const handleNextTrack = useCallback(() => {
    if (tracks.length === 0) return;

    if (isShuffle) {
      const randIdx = Math.floor(Math.random() * tracks.length);
      handlePlayTrack(tracks[randIdx]);
      return;
    }

    const currentIdx = tracks.findIndex((t) => t.id === currentTrack?.id);
    if (currentIdx !== -1 && currentIdx < tracks.length - 1) {
      handlePlayTrack(tracks[currentIdx + 1]);
    } else {
      handlePlayTrack(tracks[0]);
    }
  }, [tracks, isShuffle, currentTrack, handlePlayTrack]);

  // Previous Track
  const handlePrevTrack = useCallback(() => {
    if (currentPosition > 4) {
      setCurrentPosition(0);
      if (soundRef.current) {
        try {
          soundRef.current.seekTo(0);
        } catch (_) {}
      }
      return;
    }
    const currentIdx = tracks.findIndex((t) => t.id === currentTrack?.id);
    if (currentIdx > 0) {
      handlePlayTrack(tracks[currentIdx - 1]);
    } else {
      handlePlayTrack(tracks[tracks.length - 1]);
    }
  }, [currentPosition, tracks, currentTrack, handlePlayTrack]);

  // Toggle Play / Pause
  const handleTogglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (soundRef.current) {
        try {
          soundRef.current.pause();
        } catch (_) {}
      }
    } else {
      setIsPlaying(true);
      if (soundRef.current) {
        try {
          soundRef.current.play();
        } catch (_) {}
      }
    }
  };

  // Interactive Audio Seeking (Scrubber)
  const handleSeek = (targetSeconds) => {
    setCurrentPosition(targetSeconds);
    if (soundRef.current) {
      try {
        soundRef.current.seekTo(targetSeconds);
      } catch (e) {
        console.log('Error seeking position:', e);
      }
    }
  };

  // Playback Speed Controller
  const handleSetSpeed = (newSpeed) => {
    setPlaybackSpeed(newSpeed);
    if (soundRef.current) {
      try {
        soundRef.current.playbackRate = newSpeed;
      } catch (e) {
        console.log('Error setting speed:', e);
      }
    }
  };

  // Bedtime Sleep Timer
  const handleSetSleepTimer = (minutes) => {
    if (sleepTimerRef.current) {
      clearInterval(sleepTimerRef.current);
      sleepTimerRef.current = null;
    }

    if (!minutes) {
      setSleepTimerRemaining(null);
      return;
    }

    const totalSeconds = minutes * 60;
    setSleepTimerRemaining(totalSeconds);

    sleepTimerRef.current = setInterval(() => {
      setSleepTimerRemaining((prev) => {
        if (!prev || prev <= 1) {
          clearInterval(sleepTimerRef.current);
          sleepTimerRef.current = null;
          // Pause playback gently
          setIsPlaying(false);
          if (soundRef.current) {
            try {
              soundRef.current.pause();
            } catch (_) {}
          }
          Alert.alert("Sleep Timer Ended 🌙", "Selah has gently paused your music. Goodnight!");
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Fallback Time ticker (only active when native audio player is not attached)
  useEffect(() => {
    if (isPlaying && !soundRef.current) {
      playbackTimer.current = setInterval(() => {
        setCurrentPosition((prev) => {
          if (prev >= duration && duration > 0) {
            if (isRepeat) {
              handleSeek(0);
              return 0;
            }
            handleNextTrack();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (playbackTimer.current) {
        clearInterval(playbackTimer.current);
      }
    }

    return () => {
      if (playbackTimer.current) {
        clearInterval(playbackTimer.current);
      }
    };
  }, [isPlaying, duration, isRepeat, handleNextTrack]);

  // Toggle Favorite with permanent persistence
  const handleToggleFavorite = (trackId) => {
    setFavorites((prev) => {
      const updated = prev.includes(trackId)
        ? prev.filter((id) => id !== trackId)
        : [...prev, trackId];
      StorageService.saveFavorites(updated);
      return updated;
    });
  };

  // Add individual local track
  const handleAddLocalTrack = (newTrack) => {
    setLocalTracks((prev) => {
      const updated = [newTrack, ...prev];
      StorageService.saveLocalTracks(updated);
      return updated;
    });
    setTracks((prev) => [newTrack, ...prev]);
  };

  // Batch add local tracks (from auto-scan)
  const handleBatchAddLocalTracks = (newTracks) => {
    setLocalTracks((prev) => {
      const existingIds = new Set(prev.map(t => t.id));
      const fresh = newTracks.filter(t => !existingIds.has(t.id));
      const updated = [...fresh, ...prev];
      StorageService.saveLocalTracks(updated);
      return updated;
    });
    setTracks((prev) => {
      const existingIds = new Set(prev.map(t => t.id));
      const fresh = newTracks.filter(t => !existingIds.has(t.id));
      return [...fresh, ...prev];
    });
  };

  // Delete local track
  const handleDeleteLocalTrack = (trackId) => {
    setLocalTracks((prev) => {
      const updated = prev.filter((t) => t.id !== trackId);
      StorageService.saveLocalTracks(updated);
      return updated;
    });
    setTracks((prev) => prev.filter((t) => t.id !== trackId));
  };

  // Add YouTube Track
  const handleAddYouTubeTrack = (newTrack) => {
    setTracks((prev) => [newTrack, ...prev]);
  };

  // Filtered tracks
  const visibleTracks = tracks.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      (t.category && t.category.toLowerCase().includes(q))
    );
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0D14" />

      {/* Top Header */}
      <TopHeader
        streakDays={streakData.streakDays || 14}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenAi={() => setActiveTab('ai')}
      />

      {/* Active Screen View */}
      <View style={styles.mainContent}>
        {activeTab === 'home' && (
          <HomeScreen
            devotion={{ ...DAILY_DEVOTION, streakDays: streakData.streakDays || 14 }}
            tracks={visibleTracks}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            onPlayTrack={handlePlayTrack}
            activeMood={activeMood}
            setActiveMood={setActiveMood}
            moodTags={MOOD_TAGS}
            onOpenAi={() => setActiveTab('ai')}
          />
        )}

        {activeTab === 'library' && (
          <LocalLibraryScreen
            localTracks={localTracks}
            onAddLocalTrack={handleAddLocalTrack}
            onBatchAddLocalTracks={handleBatchAddLocalTracks}
            onPlayTrack={handlePlayTrack}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            onDeleteTrack={handleDeleteLocalTrack}
          />
        )}

        {activeTab === 'youtube' && (
          <YouTubeWatchScreen
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            onPlayTrack={handlePlayTrack}
            onAddYouTubeTrack={handleAddYouTubeTrack}
          />
        )}

        {activeTab === 'playlists' && (
          <PlaylistsScreen
            tracks={tracks}
            favorites={favorites}
            onPlayTrack={handlePlayTrack}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
          />
        )}

        {activeTab === 'settings' && (
          <EqualizerScreen 
            sleepTimerRemaining={sleepTimerRemaining}
            onSetSleepTimer={handleSetSleepTimer}
            playbackSpeed={playbackSpeed}
            onSetSpeed={handleSetSpeed}
          />
        )}
      </View>

      {/* Selah Floating Bottom Mini-Player Bar */}
      <MiniPlayerBar
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        onNext={handleNextTrack}
        onOpenFullPlayer={() => setIsFullPlayerVisible(false) || setIsFullPlayerVisible(true)}
        currentPosition={currentPosition}
        duration={duration}
      />

      {/* Selah Expandable Full Player Modal */}
      <FullPlayerModal
        visible={isFullPlayerVisible}
        onClose={() => setIsFullPlayerVisible(false)}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        onNext={handleNextTrack}
        onPrev={handlePrevTrack}
        isShuffle={isShuffle}
        onToggleShuffle={() => setIsShuffle((prev) => !prev)}
        isRepeat={isRepeat}
        onToggleRepeat={() => setIsRepeat((prev) => !prev)}
        isFavorite={favorites.includes(currentTrack?.id)}
        onToggleFavorite={handleToggleFavorite}
        currentPosition={currentPosition}
        duration={duration}
        onSeek={handleSeek}
        playbackSpeed={playbackSpeed}
        onSetSpeed={handleSetSpeed}
        sleepTimerRemaining={sleepTimerRemaining}
        onSetSleepTimer={handleSetSleepTimer}
      />

      {/* Bottom Navigation Tabs */}
      <BottomTabs 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        onSelectTab={setActiveTab} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0D14'
  },
  mainContent: {
    flex: 1
  }
});
