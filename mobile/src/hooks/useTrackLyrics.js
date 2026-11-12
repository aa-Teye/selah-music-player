import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { StorageService } from '../services/storageService';
import {
  searchLyrics,
  parseLrc,
  parsePlain,
  orderCandidates,
  isPlaceholderLyrics
} from '../services/lyricsService';

const NOT_FOUND_RETRY_MS = 3 * 24 * 60 * 60 * 1000; // ask again after 3 days if nothing was found

const EMPTY = {
  mode: 'none', // 'synced' | 'plain' | 'none'
  lines: [],
  plainLines: [],
  source: null, // 'custom' | 'lrclib' | 'built-in'
  rawText: '',
  matched: null,
  versionCount: 0,
  instrumental: false
};

/**
 * Finds and manages lyrics for one track.
 * Order of preference: lyrics the user saved > cached/online (LRCLIB) > lyrics shipped with the track.
 */
export default function useTrackLyrics(track, { duration = 0 } = {}) {
  const trackId = track?.id || null;
  const trackTitle = track?.title || '';
  const trackArtist = track?.artist || '';
  const canSearch = Boolean(track) && track.sourceType !== 'youtube' && !track.youtubeId && !String(trackId).startsWith('track-');
  const builtInText = track && !isPlaceholderLyrics(track.lyrics) ? track.lyrics : null;

  const [data, setData] = useState({
    trackId: null,
    status: 'loading', // 'loading' | 'ready' | 'none' | 'error'
    custom: null,
    candidates: [],
    versionIndex: 0,
    error: null
  });
  const [offset, setOffset] = useState(0);
  const requestRef = useRef(0);

  const load = useCallback(
    async (force) => {
      const requestId = ++requestRef.current;
      if (!trackId) {
        setData({ trackId: null, status: 'none', custom: null, candidates: [], versionIndex: 0, error: null });
        return;
      }
      setData((prev) => ({ ...prev, trackId, status: 'loading', error: null }));

      const [custom, savedOffset] = await Promise.all([
        StorageService.getCustomLyrics(trackId),
        StorageService.getLyricsOffset(trackId)
      ]);
      if (requestId !== requestRef.current) return;
      setOffset(savedOffset || 0);

      if (custom) {
        setData({ trackId, status: 'ready', custom, candidates: [], versionIndex: 0, error: null });
        return;
      }

      if (!canSearch) {
        setData({ trackId, status: builtInText ? 'ready' : 'none', custom: null, candidates: [], versionIndex: 0, error: null });
        return;
      }

      if (!force) {
        const cached = await StorageService.getLyricsCache(trackId);
        if (requestId !== requestRef.current) return;
        const stillValid =
          cached &&
          Array.isArray(cached.candidates) &&
          (!cached.notFound || Date.now() - (cached.fetchedAt || 0) < NOT_FOUND_RETRY_MS);
        if (stillValid) {
          setData({
            trackId,
            status: cached.candidates.length > 0 ? 'ready' : 'none',
            custom: null,
            candidates: cached.candidates,
            versionIndex: cached.versionIndex || 0,
            error: null
          });
          return;
        }
      }

      try {
        const found = await searchLyrics({ title: trackTitle, artist: trackArtist });
        if (requestId !== requestRef.current) return;
        const usable = found.filter((c) => c.synced || c.plain || c.instrumental);
        StorageService.saveLyricsCache(trackId, {
          candidates: usable,
          fetchedAt: Date.now(),
          notFound: usable.length === 0,
          versionIndex: 0
        });
        setData({
          trackId,
          status: usable.length > 0 ? 'ready' : 'none',
          custom: null,
          candidates: usable,
          versionIndex: 0,
          error: null
        });
      } catch (err) {
        if (requestId !== requestRef.current) return;
        setData({
          trackId,
          status: builtInText ? 'ready' : 'error',
          custom: null,
          candidates: [],
          versionIndex: 0,
          error: err?.message || 'Could not reach the lyrics service'
        });
      }
    },
    [trackId, trackTitle, trackArtist, canSearch, builtInText]
  );

  useEffect(() => {
    load(false);
  }, [load]);

  const isCurrent = data.trackId === trackId;

  const derived = useMemo(() => {
    if (!isCurrent) return EMPTY;

    if (data.custom) {
      const lines = parseLrc(data.custom);
      return {
        ...EMPTY,
        mode: lines.length > 0 ? 'synced' : 'plain',
        lines,
        plainLines: lines.length > 0 ? [] : parsePlain(data.custom),
        source: 'custom',
        rawText: data.custom
      };
    }

    if (data.candidates.length > 0) {
      const ordered = orderCandidates(data.candidates, duration);
      const chosen = ordered[data.versionIndex % ordered.length];
      const lines = parseLrc(chosen.synced);
      const plainLines = lines.length > 0 ? [] : parsePlain(chosen.plain);
      return {
        mode: lines.length > 0 ? 'synced' : plainLines.length > 0 ? 'plain' : 'none',
        lines,
        plainLines,
        source: 'lrclib',
        rawText: chosen.synced || chosen.plain || '',
        matched: chosen,
        versionCount: ordered.length,
        instrumental: Boolean(chosen.instrumental) && lines.length === 0 && plainLines.length === 0
      };
    }

    if (builtInText) {
      const lines = parseLrc(builtInText);
      return {
        ...EMPTY,
        mode: lines.length > 0 ? 'synced' : 'plain',
        lines,
        plainLines: lines.length > 0 ? [] : parsePlain(builtInText),
        source: 'built-in',
        rawText: builtInText
      };
    }

    return EMPTY;
  }, [isCurrent, data.custom, data.candidates, data.versionIndex, duration, builtInText]);

  const refresh = useCallback(() => load(true), [load]);

  const saveCustom = useCallback(
    async (text) => {
      if (!trackId) return;
      const clean = (text || '').trim();
      await StorageService.saveCustomLyrics(trackId, clean);
      if (clean) {
        setData({ trackId, status: 'ready', custom: clean, candidates: [], versionIndex: 0, error: null });
      } else {
        load(false);
      }
    },
    [trackId, load]
  );

  const nextVersion = useCallback(() => {
    if (data.candidates.length < 2) return;
    const next = (data.versionIndex + 1) % data.candidates.length;
    setData((prev) => ({ ...prev, versionIndex: next }));
    StorageService.saveLyricsCache(trackId, {
      candidates: data.candidates,
      fetchedAt: Date.now(),
      notFound: false,
      versionIndex: next
    });
  }, [data.candidates, data.versionIndex, trackId]);

  const adjustOffset = useCallback(
    (delta) => {
      const next = Math.max(-15, Math.min(15, Math.round((offset + delta) * 10) / 10));
      setOffset(next);
      StorageService.saveLyricsOffset(trackId, next);
    },
    [offset, trackId]
  );

  return {
    ...derived,
    status: isCurrent ? data.status : 'loading',
    error: isCurrent ? data.error : null,
    canSearch,
    versionIndex: data.versionIndex,
    offset,
    refresh,
    saveCustom,
    nextVersion,
    adjustOffset
  };
}
