import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View, StatusBar, Alert, Platform, Modal, Linking, TouchableOpacity, Text, ScrollView } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { createAudioPlayer, setAudioModeAsync, requestNotificationPermissionsAsync } from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';

import TopHeader from './src/components/TopHeader';
import BottomTabs from './src/components/BottomTabs';
import MiniPlayerBar from './src/components/MiniPlayerBar';

import HomeScreen from './src/screens/HomeScreen';
import PlayerScreen from './src/screens/PlayerScreen';
import LocalLibraryScreen from './src/screens/LocalLibraryScreen';
import YouTubeWatchScreen from './src/screens/YouTubeWatchScreen';
import PlaylistsScreen from './src/screens/PlaylistsScreen';
import EqualizerScreen from './src/screens/EqualizerScreen';
import HeaderMenuModal from './src/components/HeaderMenuModal';
import AddToPlaylistModal from './src/components/AddToPlaylistModal';
import SetRingtoneModal from './src/components/SetRingtoneModal';
import AudioTrimmerModal from './src/components/AudioTrimmerModal';
import CarModeModal from './src/components/CarModeModal';
import ListeningStatsModal from './src/components/ListeningStatsModal';
import PrayerBookmarksModal from './src/components/PrayerBookmarksModal';
import AmbientSoundscapesModal from './src/components/AmbientSoundscapesModal';
import EditTagsModal from './src/components/EditTagsModal';
import OnboardingArtistsModal from './src/components/OnboardingArtistsModal';

import { DEVOTIONAL_COLLECTION, DIGITAL_LIBRARIES, INITIAL_TRACKS, MOOD_TAGS } from './src/data/mockData';
import { StorageService } from './src/services/storageService';
import { ScannerService } from './src/services/scannerService';
import { SOUNDSCAPE_ASSETS } from './src/data/soundscapes';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [tracks, setTracks] = useState(INITIAL_TRACKS);
  const [localTracks, setLocalTracks] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [playlistModalTrack, setPlaylistModalTrack] = useState(null);
  const [ringtoneModalTrack, setRingtoneModalTrack] = useState(null);
  const [trimmerModalTrack, setTrimmerModalTrack] = useState(null);
  const [isCarModeVisible, setIsCarModeVisible] = useState(false);
  const [isStatsVisible, setIsStatsVisible] = useState(false);
  const [recentTracks, setRecentTracks] = useState([]);
  const [listeningStats, setListeningStats] = useState({ totalSeconds: 0, tracksPlayedCount: 0 });
  const [bookmarks, setBookmarks] = useState([]);
  const [isBookmarksModalVisible, setIsBookmarksModalVisible] = useState(false);
  const [isAmbientModalVisible, setIsAmbientModalVisible] = useState(false);
  const [activeSoundscape, setActiveSoundscape] = useState(null);
  const [ambientVolume, setAmbientVolume] = useState(0.5);
  const [crossfadeSeconds, setCrossfadeSeconds] = useState(0);
  const [isHeaderMenuVisible, setIsHeaderMenuVisible] = useState(false);
  const [isEqVisible, setIsEqVisible] = useState(false);
  const [tagEditTrack, setTagEditTrack] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(INITIAL_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [duration, setDuration] = useState(INITIAL_TRACKS[0].duration || 180);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [favorites, setFavorites] = useState(['track-1', 'track-2']);
  const [playerView, setPlayerView] = useState('now'); // 'now' | 'lyrics' | 'queue' | 'library'
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMood, setActiveMood] = useState('all');
  const [streakData, setStreakData] = useState({ streakDays: 1 });
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState(null);
  const [favoriteArtists, setFavoriteArtists] = useState([]);
  const [isOnboardingVisible, setIsOnboardingVisible] = useState(false);
  const [devotionalIndex, setDevotionalIndex] = useState(0);
  const [isDigitalLibrariesVisible, setIsDigitalLibrariesVisible] = useState(false);

  const soundRef = useRef(null);
  const statusSubRef = useRef(null);
  const playbackTimer = useRef(null);
  const sleepTimerRef = useRef(null);
  const handleNextTrackRef = useRef(null);
  const isRepeatRef = useRef(isRepeat);
  const isShuffleRef = useRef(isShuffle);
  const crossfadeRef = useRef(0);
  const sleepEndRef = useRef(null);
  const positionRef = useRef(0);
  const listenAccumRef = useRef(0);
  const isPlayingRef = useRef(false);
  const ambientPlayerRef = useRef(null);
  const ambientVolumeRef = useRef(0.5);

  // Queue: null = play through the whole library; array = custom queue (e.g. a playlist)
  const [queueOverride, setQueueOverride] = useState(null);
  const queue = queueOverride ?? tracks;

  useEffect(() => {
    crossfadeRef.current = crossfadeSeconds;
  }, [crossfadeSeconds]);

  useEffect(() => {
    positionRef.current = currentPosition;
  }, [currentPosition]);

  // Ambient soundscape: real looping background audio layered under the music
  useEffect(() => {
    ambientVolumeRef.current = ambientVolume;
    if (ambientPlayerRef.current) {
      try {
        ambientPlayerRef.current.volume = ambientVolume;
      } catch {}
    }
  }, [ambientVolume]);

  useEffect(() => {
    const source = activeSoundscape ? SOUNDSCAPE_ASSETS[activeSoundscape] : null;
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      // let the soundscape play together with the music instead of pausing it
      interruptionMode: source ? 'mixWithOthers' : 'doNotMix'
    }).catch(() => {});
    if (!source) return undefined;
    let player = null;
    try {
      player = createAudioPlayer(source);
      player.loop = true;
      player.volume = ambientVolumeRef.current;
      player.play();
      ambientPlayerRef.current = player;
    } catch (err) {
      console.log('Ambient soundscape notice:', err);
    }
    return () => {
      try {
        player?.pause();
        player?.remove();
      } catch {}
      if (ambientPlayerRef.current === player) ambientPlayerRef.current = null;
    };
  }, [activeSoundscape]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Count REAL listening time (flush to storage every 30s and when playback stops)
  useEffect(() => {
    if (!isPlaying) return undefined;
    const flush = () => {
      const secs = listenAccumRef.current;
      if (secs > 0) {
        listenAccumRef.current = 0;
        StorageService.addListeningSeconds(secs).then((stats) => {
          if (stats) setListeningStats(stats);
        });
      }
    };
    const timer = setInterval(() => {
      listenAccumRef.current += 1;
      if (listenAccumRef.current >= 30) flush();
    }, 1000);
    return () => {
      clearInterval(timer);
      flush();
    };
  }, [isPlaying]);

  // Remember where the user stopped so the app can resume on next launch
  useEffect(() => {
    if (!currentTrack?.id) return undefined;
    if (!isPlaying) {
      StorageService.saveLastPlayed(currentTrack.id, positionRef.current);
      return undefined;
    }
    const timer = setInterval(() => {
      StorageService.saveLastPlayed(currentTrack.id, positionRef.current);
    }, 10000);
    return () => clearInterval(timer);
  }, [isPlaying, currentTrack?.id]);

  useEffect(() => {
    isRepeatRef.current = isRepeat;
  }, [isRepeat]);

  useEffect(() => {
    isShuffleRef.current = isShuffle;
  }, [isShuffle]);

  // Initialize native audio & Load persistent state
  useEffect(() => {
    async function initApp() {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: true,
          interruptionMode: 'doNotMix'
        }).catch((err) => console.log('AudioMode configuration notice:', err));

        // Request notification permission for lock-screen & shade controls on Android
        if (Platform.OS === 'android') {
          try {
            await requestNotificationPermissionsAsync();
          } catch (notifErr) {
            console.log('Notification permission notice:', notifErr);
          }
        }

        // Load saved favorites, local tracks, streak, playlists, recent tracks, stats, bookmarks & settings
        const [savedFavs, savedLocal, savedStreak, savedPlaylists, savedRecent, savedStats, savedBookmarks, savedSettings, savedHasOnboarded, savedFavArtists] = await Promise.all([
          StorageService.getFavorites(),
          StorageService.getLocalTracks(),
          StorageService.recordDailyStreak(),
          StorageService.getPlaylists(),
          StorageService.getRecentlyPlayed(),
          StorageService.getListeningStats(),
          StorageService.getBookmarks(),
          StorageService.getSettings(),
          StorageService.getHasOnboarded(),
          StorageService.getFavoriteArtists()
        ]);

        if (savedFavs) setFavorites(savedFavs);
        if (savedStreak) setStreakData(savedStreak);
        if (savedPlaylists) setPlaylists(savedPlaylists);
        if (savedRecent) setRecentTracks(savedRecent);
        if (savedStats) setListeningStats(savedStats);
        if (savedBookmarks) setBookmarks(savedBookmarks);
        if (savedHasOnboarded === false) {
          setIsOnboardingVisible(true);
        }
        if (savedFavArtists && savedFavArtists.length > 0) {
          setFavoriteArtists(savedFavArtists);
        }
        if (savedSettings) {
          if (typeof savedSettings.crossfadeSeconds === 'number') setCrossfadeSeconds(savedSettings.crossfadeSeconds);
          if (typeof savedSettings.ambientVolume === 'number') setAmbientVolume(savedSettings.ambientVolume);
        }
        if (savedLocal && savedLocal.length > 0) {
          setLocalTracks(savedLocal);
          setTracks((prev) => [...savedLocal, ...prev]);
          setCurrentTrack(savedLocal[0]);
          setDuration(savedLocal[0].duration || 180);
        }

        // Resume the last played track (paused, ready to continue)
        try {
          const last = await StorageService.getLastPlayed();
          if (last?.trackId) {
            const pool = [...(savedLocal || []), ...INITIAL_TRACKS];
            const lastTrack = pool.find((t) => t.id === last.trackId);
            if (lastTrack && lastTrack.sourceType !== 'youtube') {
              setCurrentTrack(lastTrack);
              setDuration(lastTrack.duration || 180);
              setCurrentPosition(Math.floor(last.position || 0));
            }
          }
        } catch {}

        // Automatic background auto-scan for all phone MP3s & audio files
        if (Platform.OS === 'android') ScannerService.scanDeviceAudio(40, 200).then((scanResult) => {
          if (scanResult && scanResult.success && scanResult.tracks.length > 0) {
            const foundTracks = scanResult.tracks;
            const foundUris = new Set(foundTracks.map((t) => t.uri));
            // Songs that were scanned earlier but no longer exist on the phone
            const isStale = (t) => String(t.id).startsWith('local-scan-') && !foundUris.has(t.uri);

            setLocalTracks((prev) => {
              const existingUris = new Set(prev.map((t) => t.uri || t.id));
              const newFound = foundTracks.filter((t) => !existingUris.has(t.uri || t.id));
              const kept = prev.filter((t) => !isStale(t));
              if (newFound.length === 0 && kept.length === prev.length) return prev;
              const merged = [...newFound, ...kept];
              StorageService.saveLocalTracks(merged);
              return merged;
            });
            setTracks((prev) => {
              const existingUris = new Set(prev.map((t) => t.uri || t.id));
              const newFound = foundTracks.filter((t) => !existingUris.has(t.uri || t.id));
              const kept = prev.filter((t) => !isStale(t));
              if (newFound.length === 0 && kept.length === prev.length) return prev;
              return [...newFound, ...kept];
            });
            // Automatically add discovered MP3s to recent tracks for instant visibility
            setRecentTracks((prev) => {
              const existingUris = new Set(prev.map((t) => t.uri || t.id));
              const newFound = foundTracks.filter((t) => !existingUris.has(t.uri || t.id));
              if (newFound.length > 0) {
                const updatedRecent = [...newFound, ...prev].slice(0, 50);
                StorageService.saveRecentlyPlayed(updatedRecent);
                return updatedRecent;
              }
              return prev;
            });
          }
        }).catch((scanErr) => console.log('Auto-scan background notice:', scanErr));
      } catch (e) {
        console.log('Error initializing app storage:', e);
      }
    }
    initApp();

    return () => {
      if (statusSubRef.current) {
        try {
          statusSubRef.current.remove();
        } catch {}
      }
      if (soundRef.current) {
        try {
          soundRef.current.pause();
          soundRef.current.remove();
        } catch {}
      }
      if (playbackTimer.current) {
        clearInterval(playbackTimer.current);
      }
      if (sleepTimerRef.current) {
        clearInterval(sleepTimerRef.current);
      }
    };
  }, []);

  // Smoothly adjust volume: crossfade-style fade in/out at track edges + sleep-timer fade-out
  const applyVolume = useCallback((player, position, total) => {
    if (!player) return;
    let factor = 1;
    const cf = crossfadeRef.current;
    if (cf > 0 && total > cf * 2) {
      const fadeIn = Math.max(0, Math.min(1, (position + 1) / cf));
      const fadeOut = Math.max(0, Math.min(1, (total - position) / cf));
      factor = Math.min(factor, fadeIn, fadeOut);
    }
    if (sleepEndRef.current) {
      const remaining = (sleepEndRef.current - Date.now()) / 1000;
      if (remaining <= 10) factor = Math.min(factor, Math.max(0, remaining / 10));
    }
    try {
      if (player.volume !== factor) player.volume = factor;
    } catch {}
  }, []);

  // Handle Play a Track  (opts: { keepQueue, resumeAt })
  const handlePlayTrack = useCallback(async (track, opts) => {
    if (!track) return;
    const options = opts && typeof opts === 'object' && !opts.nativeEvent ? opts : {};
    const resumeAt = typeof options.resumeAt === 'number' && options.resumeAt > 1 ? options.resumeAt : 0;

    // Playing something outside the custom queue returns to the whole library
    if (!options.keepQueue) {
      setQueueOverride((prev) => (prev && prev.some((t) => t.id === track.id) ? prev : null));
    }

    setCurrentTrack(track);
    setIsPlaying(true);
    setCurrentPosition(resumeAt);
    setDuration(track.duration || 180);

    // Record to recently played and count the play (real listening time is tracked separately)
    StorageService.addRecentlyPlayed(track).then((updated) => {
      if (updated) setRecentTracks(updated);
    });
    StorageService.recordTrackPlayed().then((stats) => {
      if (stats) setListeningStats(stats);
    });

    // Clean up previous audio player so it stops immediately (e.g. when switching to YouTube or a new track)
    if (statusSubRef.current) {
      try {
        statusSubRef.current.remove();
      } catch {}
      statusSubRef.current = null;
    }

    if (soundRef.current) {
      try {
        soundRef.current.pause();
        soundRef.current.remove();
      } catch {}
      soundRef.current = null;
    }

    // If it's a YouTube track, activate YouTube streaming engine
    if (track.sourceType === 'youtube') {
      setActiveTab('youtube');
      return;
    }

    // Play immediately if audio source exists (bundled asset or streaming/file URI)
    const audioSource = track.asset || track.uri;
    if (audioSource) {
      try {
        const player = createAudioPlayer(audioSource);
        soundRef.current = player;
        if (typeof player.setPlaybackRate === 'function') {
          player.setPlaybackRate(playbackSpeed);
        }

        // Configure system lock screen and notification shade media controls
        if (typeof player.setActiveForLockScreen === 'function') {
          try {
            player.setActiveForLockScreen(true, {
              title: track.title || 'Worship Track',
              artist: track.artist || 'Selah Music',
              album: track.album || 'Selah Local Audio',
              artworkUrl: track.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=500&q=80'
            });
          } catch (lockErr) {
            console.log('Lock screen activation notice:', lockErr);
          }
        }

        player.play();
        if (resumeAt > 0) {
          try {
            player.seekTo(resumeAt);
          } catch {}
        }

        const sub = player.addListener('playbackStatusUpdate', (status) => {
          if (status.duration && status.duration > 0) {
            setDuration(Math.floor(status.duration));
          }
          if (typeof status.currentTime === 'number') {
            setCurrentPosition(Math.floor(status.currentTime));
            applyVolume(player, status.currentTime, status.duration || track.duration || 0);
          }
          if (status.didJustFinish) {
            if (isRepeatRef.current) {
              try {
                player.seekTo(0);
                player.play();
              } catch {
                handleNextTrackRef.current?.();
              }
            } else {
              handleNextTrackRef.current?.();
            }
          }
        });
        statusSubRef.current = sub;
      } catch (err) {
        console.log('Error playing audio sound:', err);
      }
    }
  }, [playbackSpeed, applyVolume]);

  // Next Track
  const handleNextTrack = useCallback(() => {
    if (queue.length === 0) return;
    const keep = { keepQueue: true };

    if (isShuffleRef.current || isShuffle) {
      const pool = queue.length > 1 ? queue.filter((t) => t.id !== currentTrack?.id) : queue;
      handlePlayTrack(pool[Math.floor(Math.random() * pool.length)], keep);
      return;
    }

    const currentIdx = queue.findIndex((t) => t.id === currentTrack?.id);
    if (currentIdx !== -1 && currentIdx < queue.length - 1) {
      handlePlayTrack(queue[currentIdx + 1], keep);
    } else {
      handlePlayTrack(queue[0], keep);
    }
  }, [queue, isShuffle, currentTrack, handlePlayTrack]);

  useEffect(() => {
    handleNextTrackRef.current = handleNextTrack;
  }, [handleNextTrack]);

  // Previous Track
  const handlePrevTrack = useCallback(() => {
    if (currentPosition > 4) {
      setCurrentPosition(0);
      if (soundRef.current) {
        try {
          soundRef.current.seekTo(0);
        } catch {}
      }
      return;
    }
    if (queue.length === 0) return;
    const keep = { keepQueue: true };
    const currentIdx = queue.findIndex((t) => t.id === currentTrack?.id);
    if (currentIdx > 0) {
      handlePlayTrack(queue[currentIdx - 1], keep);
    } else {
      handlePlayTrack(queue[queue.length - 1], keep);
    }
  }, [currentPosition, queue, currentTrack, handlePlayTrack]);

  // Toggle Play / Pause
  const handleTogglePlay = (explicitState) => {
    const nextState = typeof explicitState === 'boolean' ? explicitState : !isPlaying;

    // Cold start (e.g. after app launch / resume): no player exists yet, so create one
    if (
      nextState &&
      !soundRef.current &&
      currentTrack &&
      currentTrack.sourceType !== 'youtube' &&
      !currentTrack.youtubeId &&
      (currentTrack.asset || currentTrack.uri)
    ) {
      handlePlayTrack(currentTrack, { keepQueue: true, resumeAt: currentPosition });
      return;
    }

    setIsPlaying(nextState);
    if (nextState) {
      if (soundRef.current && currentTrack?.sourceType !== 'youtube') {
        try {
          soundRef.current.play();
        } catch {}
      }
    } else {
      if (soundRef.current) {
        try {
          soundRef.current.pause();
        } catch {}
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
        if (typeof soundRef.current.setPlaybackRate === 'function') {
          soundRef.current.setPlaybackRate(newSpeed);
        }
      } catch (e) {
        console.log('Error setting speed:', e);
      }
    }
  };

  // Bedtime Sleep Timer (fades the music out over the last 10 seconds, then pauses)
  const handleSetSleepTimer = (minutes) => {
    if (sleepTimerRef.current) {
      clearInterval(sleepTimerRef.current);
      sleepTimerRef.current = null;
    }
    sleepEndRef.current = null;
    if (soundRef.current) {
      try {
        soundRef.current.volume = 1;
      } catch {}
    }

    if (!minutes) {
      setSleepTimerRemaining(null);
      return;
    }

    const endAt = Date.now() + minutes * 60 * 1000;
    sleepEndRef.current = endAt;
    setSleepTimerRemaining(minutes * 60);

    sleepTimerRef.current = setInterval(() => {
      const remaining = Math.ceil((endAt - Date.now()) / 1000);
      if (remaining <= 0) {
        clearInterval(sleepTimerRef.current);
        sleepTimerRef.current = null;
        sleepEndRef.current = null;
        setSleepTimerRemaining(null);
        setIsPlaying(false);
        setActiveSoundscape(null);
        if (soundRef.current) {
          try {
            soundRef.current.pause();
            soundRef.current.volume = 1;
          } catch {}
        }
        Alert.alert("Sleep Timer Ended 🌙", "Selah has gently paused your music. Goodnight!");
        return;
      }
      setSleepTimerRemaining(remaining);
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

  // Batch add local tracks (from auto-scan or multi-import)
  const handleBatchAddLocalTracks = (newTracks) => {
    if (!newTracks || newTracks.length === 0) return;
    setLocalTracks((prev) => {
      const existingIds = new Set(prev.map(t => t.id || t.uri));
      const fresh = newTracks.filter(t => !existingIds.has(t.id || t.uri));
      const updated = [...fresh, ...prev];
      StorageService.saveLocalTracks(updated);
      return updated;
    });
    setTracks((prev) => {
      const existingIds = new Set(prev.map(t => t.id || t.uri));
      const fresh = newTracks.filter(t => !existingIds.has(t.id || t.uri));
      return [...fresh, ...prev];
    });
    setRecentTracks((prev) => {
      const existingIds = new Set(prev.map(t => t.id || t.uri));
      const fresh = newTracks.filter(t => !existingIds.has(t.id || t.uri));
      if (fresh.length > 0) {
        const updatedRecent = [...fresh, ...prev].slice(0, 50);
        StorageService.saveRecentlyPlayed(updatedRecent);
        return updatedRecent;
      }
      return prev;
    });

    if (newTracks.length > 0 && (!currentTrack || currentTrack.id === INITIAL_TRACKS[0]?.id)) {
      setCurrentTrack(newTracks[0]);
      setDuration(newTracks[0].duration || 180);
    }
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

  // Add YouTube Track with duplicate check
  const handleAddYouTubeTrack = (newTrack) => {
    if (!newTrack) return;
    setTracks((prev) => {
      if (prev.some((t) => t.id === newTrack.id || (newTrack.youtubeId && t.youtubeId === newTrack.youtubeId))) {
        return prev;
      }
      return [newTrack, ...prev];
    });
  };

  // Create new custom playlist
  const handleCreatePlaylist = (name, initialTrackId) => {
    const newPl = {
      id: `pl-${Date.now()}`,
      name,
      trackIds: initialTrackId ? [initialTrackId] : [],
      createdAt: new Date().toISOString()
    };
    setPlaylists((prev) => {
      const updated = [newPl, ...prev];
      StorageService.savePlaylists(updated);
      return updated;
    });
    Alert.alert("Playlist Created 🎵", `"${name}" has been created!`);
  };

  // Delete custom playlist
  const handleDeletePlaylist = (playlistId) => {
    setPlaylists((prev) => {
      const updated = prev.filter((p) => p.id !== playlistId);
      StorageService.savePlaylists(updated);
      return updated;
    });
  };

  // Toggle track inside a playlist
  const handleToggleTrackInPlaylist = (playlistId, trackId) => {
    setPlaylists((prev) => {
      const updated = prev.map((pl) => {
        if (pl.id !== playlistId) return pl;
        const exists = (pl.trackIds || []).includes(trackId);
        const newTrackIds = exists
          ? pl.trackIds.filter((id) => id !== trackId)
          : [...(pl.trackIds || []), trackId];
        return { ...pl, trackIds: newTrackIds };
      });
      StorageService.savePlaylists(updated);
      return updated;
    });
  };

  // Play entire playlist
  const handlePlayPlaylist = (playlistTracks) => {
    if (!playlistTracks || playlistTracks.length === 0) return;
    setTracks((prev) => {
      const existingIds = new Set(prev.map(t => t.id));
      const fresh = playlistTracks.filter(t => !existingIds.has(t.id));
      return [...fresh, ...prev];
    });
    setQueueOverride(playlistTracks);
    handlePlayTrack(playlistTracks[0]);
  };

  // Open Add to Playlist Modal
  const handleOpenAddToPlaylist = (track) => {
    setPlaylistModalTrack(track);
  };

  // Open Set Ringtone / Caller Tune Modal
  const handleOpenSetRingtone = (track) => {
    setRingtoneModalTrack(track || currentTrack);
  };

  // Scripture & Prayer Bookmarks
  const handleAddBookmark = (entry) => {
    StorageService.addBookmark(entry).then((updated) => {
      if (updated) setBookmarks(updated);
    });
  };

  const handleDeleteBookmark = (bmId) => {
    StorageService.deleteBookmark(bmId).then((updated) => {
      if (updated) setBookmarks(updated);
    });
  };

  const handleJumpToBookmark = (bm) => {
    if (currentTrack?.id !== bm.trackId) {
      const target = tracks.find((t) => t.id === bm.trackId);
      if (target) {
        handlePlayTrack(target);
      }
    }
    setTimeout(() => {
      handleSeek(bm.timestamp);
    }, 300);
  };

  // Soundscape & Crossfade settings
  const handleSetCrossfade = (seconds) => {
    setCrossfadeSeconds(seconds);
    StorageService.saveSettings({ crossfadeSeconds: seconds, ambientSoundType: activeSoundscape, ambientVolume });
  };

  const handleSelectSoundscape = (soundType) => {
    setActiveSoundscape(soundType);
    StorageService.saveSettings({ crossfadeSeconds, ambientSoundType: soundType, ambientVolume });
  };

  const handleSetAmbientVolume = (vol) => {
    setAmbientVolume(vol);
    StorageService.saveSettings({ crossfadeSeconds, ambientSoundType: activeSoundscape, ambientVolume: vol });
  };

  // In-app tag editor save
  const handleSaveEditedTrack = (updatedTrack) => {
    setLocalTracks((prev) => {
      const updated = prev.map((t) => (t.id === updatedTrack.id ? updatedTrack : t));
      StorageService.saveLocalTracks(updated);
      return updated;
    });
    setTracks((prev) => prev.map((t) => (t.id === updatedTrack.id ? updatedTrack : t)));
    if (currentTrack?.id === updatedTrack.id) {
      setCurrentTrack(updatedTrack);
    }
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

  // The Player tab is the full player (Now Playing / Lyrics / Up Next / Library)
  const openNowPlaying = () => {
    if (currentTrack?.sourceType === 'youtube' || currentTrack?.youtubeId) {
      setActiveTab('youtube');
    } else {
      setPlayerView('now');
      setActiveTab('player');
    }
  };
  const isImmersivePlayer = activeTab === 'player' && playerView !== 'library';

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      {/* Top Header */}
      {!isImmersivePlayer && (
        <TopHeader
          streakDays={streakData.streakDays || 1}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenMenu={() => setIsHeaderMenuVisible(true)}
        />
      )}

      {/* Active Screen View */}
      <View style={styles.mainContent}>
        {activeTab === 'home' && (
          <HomeScreen
            devotion={{ ...DEVOTIONAL_COLLECTION[devotionalIndex], streakDays: streakData.streakDays || 1 }}
            tracks={visibleTracks}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            onPlayTrack={handlePlayTrack}
            activeMood={activeMood}
            setActiveMood={setActiveMood}
            moodTags={MOOD_TAGS}
            onOpenAddToPlaylist={handleOpenAddToPlaylist}
            recentTracks={recentTracks}
            onOpenStats={() => setIsStatsVisible(true)}
            searchQuery={searchQuery}
            onNavigateToYouTube={(query) => {
              if (query) setSearchQuery(query);
              setActiveTab('youtube');
            }}
            favoriteArtists={favoriteArtists}
            onNextDevotional={() => setDevotionalIndex((prev) => (prev + 1) % DEVOTIONAL_COLLECTION.length)}
            onOpenDigitalLibraries={() => setIsDigitalLibrariesVisible(true)}
          />
        )}

        {activeTab === 'player' && (
          <PlayerScreen
            view={playerView}
            onChangeView={setPlayerView}
            tracks={tracks}
            localTracks={localTracks}
            recentTracks={recentTracks}
            favorites={favorites}
            playlists={playlists}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            onPlayTrack={handlePlayTrack}
            onPlayQueueTrack={(t) => handlePlayTrack(t, { keepQueue: true })}
            onOpenAddToPlaylist={handleOpenAddToPlaylist}
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
            onOpenSetRingtone={handleOpenSetRingtone}
            onOpenAudioTrimmer={(t) => setTrimmerModalTrack(t || currentTrack)}
            onOpenCarMode={() => setIsCarModeVisible(true)}
            onOpenEqualizer={() => setIsEqVisible(true)}
            queue={queue}
            onRemoveFromQueue={(trackId) => setQueueOverride((prev) => (prev ?? tracks).filter((t) => t.id !== trackId))}
            onClearQueue={() => setQueueOverride(currentTrack ? [currentTrack] : [])}
            onOpenPrayerBookmarks={() => setIsBookmarksModalVisible(true)}
            onOpenAmbientSoundscapes={() => setIsAmbientModalVisible(true)}
            activeSoundscape={activeSoundscape}
            bookmarksCount={bookmarks.filter((b) => b.trackId === currentTrack?.id).length}
          />
        )}

        {activeTab === 'library' && (
          <LocalLibraryScreen
            localTracks={localTracks}
            searchQuery={searchQuery}
            onAddLocalTrack={handleAddLocalTrack}
            onBatchAddLocalTracks={handleBatchAddLocalTracks}
            onPlayTrack={handlePlayTrack}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            onDeleteTrack={handleDeleteLocalTrack}
            onOpenAddToPlaylist={handleOpenAddToPlaylist}
            onOpenSetRingtone={handleOpenSetRingtone}
            onOpenEditTags={(track) => setTagEditTrack(track)}
          />
        )}

        {/* Keep YouTube player persistent across tabs so audio continues playing in background without Android View.GONE pause */}
        <View 
          style={
            activeTab === 'youtube'
              ? { flex: 1 }
              : { position: 'absolute', top: -99999, left: -99999, width: 1, height: 1, opacity: 0 }
          }
          pointerEvents={activeTab === 'youtube' ? 'auto' : 'none'}
        >
          <YouTubeWatchScreen
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            searchQuery={searchQuery}
            onPlayTrack={handlePlayTrack}
            onTogglePlayPause={handleTogglePlay}
            onAddYouTubeTrack={handleAddYouTubeTrack}
            onOpenAddToPlaylist={handleOpenAddToPlaylist}
            isShuffle={isShuffle}
            onToggleShuffle={() => setIsShuffle((prev) => !prev)}
            isRepeat={isRepeat}
            onToggleRepeat={() => setIsRepeat((prev) => !prev)}
            onPrevTrack={handlePrevTrack}
            onNextTrack={handleNextTrack}
          />
        </View>

        {activeTab === 'playlists' && (
          <PlaylistsScreen
            tracks={tracks}
            favorites={favorites}
            onPlayTrack={handlePlayTrack}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            playlists={playlists}
            onCreatePlaylist={handleCreatePlaylist}
            onDeletePlaylist={handleDeletePlaylist}
            onPlayPlaylist={handlePlayPlaylist}
            onToggleTrackInPlaylist={handleToggleTrackInPlaylist}
          />
        )}

        {activeTab === 'settings' && (
          <EqualizerScreen 
            sleepTimerRemaining={sleepTimerRemaining}
            onSetSleepTimer={handleSetSleepTimer}
            playbackSpeed={playbackSpeed}
            onSetSpeed={handleSetSpeed}
            crossfadeSeconds={crossfadeSeconds}
            onSetCrossfade={handleSetCrossfade}
            activeSoundscape={activeSoundscape}
            onOpenAmbientSoundscapes={() => setIsAmbientModalVisible(true)}
          />
        )}
      </View>

      {/* Selah Floating Bottom Mini-Player Bar */}
      {!isImmersivePlayer && (
        <MiniPlayerBar
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          onNext={handleNextTrack}
          onOpenFullPlayer={openNowPlaying}
          currentPosition={currentPosition}
          duration={duration}
        />
      )}

      {/* Add To Playlist Modal */}
      <AddToPlaylistModal
        visible={Boolean(playlistModalTrack)}
        track={playlistModalTrack}
        playlists={playlists}
        onClose={() => setPlaylistModalTrack(null)}
        onToggleTrackInPlaylist={handleToggleTrackInPlaylist}
        onCreatePlaylist={handleCreatePlaylist}
      />

      {/* Set Caller Tune / Ringtone Modal */}
      <SetRingtoneModal
        visible={Boolean(ringtoneModalTrack)}
        track={ringtoneModalTrack}
        onClose={() => setRingtoneModalTrack(null)}
      />

      {/* Audio Trimmer & Ringtone Cutter Modal */}
      <AudioTrimmerModal
        visible={Boolean(trimmerModalTrack)}
        track={trimmerModalTrack}
        duration={duration}
        onClose={() => setTrimmerModalTrack(null)}
        onPlayPreview={(start) => {
          handleSeek(start);
          setIsPlaying(true);
          if (soundRef.current) {
            try { soundRef.current.play(); } catch {}
          }
        }}
        onApplyRingtone={(track) => {
          setTrimmerModalTrack(null);
          setRingtoneModalTrack(track);
        }}
      />

      {/* Fullscreen Car & Stage Mode Modal */}
      <CarModeModal
        visible={isCarModeVisible}
        onClose={() => setIsCarModeVisible(false)}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        onNext={handleNextTrack}
        onPrev={handlePrevTrack}
        isFavorite={favorites.includes(currentTrack?.id)}
        onToggleFavorite={handleToggleFavorite}
      />

      {/* Worship Journey & Listening Statistics Modal */}
      <ListeningStatsModal
        visible={isStatsVisible}
        onClose={() => setIsStatsVisible(false)}
        stats={listeningStats}
        streakDays={streakData?.streakDays || 1}
        favoritesCount={favorites.length}
      />

      {/* Scripture & Prayer Bookmarks Modal */}
      <PrayerBookmarksModal
        visible={isBookmarksModalVisible}
        onClose={() => setIsBookmarksModalVisible(false)}
        currentTrack={currentTrack}
        currentPosition={currentPosition}
        bookmarks={bookmarks}
        onAddBookmark={handleAddBookmark}
        onDeleteBookmark={handleDeleteBookmark}
        onJumpToBookmark={handleJumpToBookmark}
      />

      {/* Bedtime Ambient Soundscapes Modal */}
      <AmbientSoundscapesModal
        visible={isAmbientModalVisible}
        onClose={() => setIsAmbientModalVisible(false)}
        activeSoundscape={activeSoundscape}
        onSelectSoundscape={handleSelectSoundscape}
        ambientVolume={ambientVolume}
        onSetVolume={handleSetAmbientVolume}
        sleepTimerRemaining={sleepTimerRemaining}
      />

      {/* In-App ID3 Tag Editor Modal */}
      <EditTagsModal
        visible={Boolean(tagEditTrack)}
        track={tagEditTrack}
        onClose={() => setTagEditTrack(null)}
        onSaveTrack={handleSaveEditedTrack}
      />

      {/* Header Menu Drawer Modal */}
      <HeaderMenuModal
        visible={isHeaderMenuVisible}
        onClose={() => setIsHeaderMenuVisible(false)}
        onOpenEq={() => setIsEqVisible(true)}
        onOpenStats={() => setIsStatsVisible(true)}
        onOpenSleepTimer={() => setIsEqVisible(true)}
        streakDays={streakData?.streakDays || 1}
      />

      {/* Equalizer & Sound Settings Modal */}
      <Modal
        visible={isEqVisible}
        animationType="slide"
        onRequestClose={() => setIsEqVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#08090C' }}>
          <EqualizerScreen
            onClose={() => setIsEqVisible(false)}
            sleepTimerRemaining={sleepTimerRemaining}
            onSetSleepTimer={handleSetSleepTimer}
            playbackSpeed={playbackSpeed}
            onSetSpeed={handleSetSpeed}
            crossfadeSeconds={crossfadeSeconds}
            onSetCrossfade={handleSetCrossfade}
            activeSoundscape={activeSoundscape}
            onOpenAmbientSoundscapes={() => {
              setIsEqVisible(false);
              setIsAmbientModalVisible(true);
            }}
          />
        </SafeAreaView>
      </Modal>

      {/* Digital Libraries & Hymnal Resources Modal */}
      <Modal
        visible={isDigitalLibrariesVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsDigitalLibrariesVisible(false)}
      >
        <View style={styles.libModalOverlay}>
          <View style={styles.libModalContent}>
            <View style={styles.libModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="library" size={22} color="#34D399" />
                <Text style={styles.libModalTitle}>Digital Libraries</Text>
              </View>
              <TouchableOpacity onPress={() => setIsDigitalLibrariesVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close-circle" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.libModalSub}>Connect with global Christian libraries, public-domain hymnals, and scripture study tools.</Text>

            <ScrollView style={{ marginTop: 12 }}>
              {DIGITAL_LIBRARIES.map((lib) => (
                <View key={lib.id} style={styles.libCard}>
                  <View style={styles.libIconBox}>
                    <Ionicons name={lib.icon || 'book'} size={22} color="#34D399" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.libName}>{lib.name}</Text>
                    <Text style={styles.libDesc}>{lib.description}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.libOpenBtn} 
                    onPress={() => Linking.openURL(lib.url).catch(() => Alert.alert("Notice", "Could not open browser."))}
                  >
                    <Text style={styles.libOpenText}>Open</Text>
                    <Ionicons name="open-outline" size={14} color="#08090C" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* First-Time Onboarding Favorite Artists Modal */}
      <OnboardingArtistsModal
        visible={isOnboardingVisible}
        onClose={() => {
          setIsOnboardingVisible(false);
          StorageService.setHasOnboarded(true);
        }}
        onFinish={(selectedArtists) => {
          const list = Array.isArray(selectedArtists) 
            ? selectedArtists 
            : (selectedArtists?.artists || []);
          setFavoriteArtists(list);
          StorageService.saveFavoriteArtists(list);
          StorageService.setHasOnboarded(true);
          setIsOnboardingVisible(false);
        }}
        onComplete={(res) => {
          const list = Array.isArray(res) 
            ? res 
            : (res?.artists || []);
          setFavoriteArtists(list);
          StorageService.saveFavoriteArtists(list);
          StorageService.setHasOnboarded(true);
          setIsOnboardingVisible(false);
        }}
      />

      {/* Bottom Navigation Tabs */}
      <BottomTabs 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        onSelectTab={setActiveTab} 
      />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA'
  },
  mainContent: {
    flex: 1
  },
  libModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 17, 21, 0.45)',
    justifyContent: 'flex-end'
  },
  libModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  libModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  libModalTitle: {
    color: '#0F1115',
    fontSize: 18,
    fontWeight: '800'
  },
  libModalSub: {
    color: '#717886',
    fontSize: 13,
    lineHeight: 18
  },
  libCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12
  },
  libIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EEF0F4',
    borderWidth: 1,
    borderColor: '#E2E6EC',
    alignItems: 'center',
    justifyContent: 'center'
  },
  libName: {
    color: '#0F1115',
    fontSize: 14,
    fontWeight: '700'
  },
  libDesc: {
    color: '#717886',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15
  },
  libOpenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12141A',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    gap: 4
  },
  libOpenText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12
  }
});
