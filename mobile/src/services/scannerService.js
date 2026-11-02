// ═════════════════════════════════════════════════════════════════════════
//  SELAH MUSIC PLAYER — AUTOMATIC AUDIO SCANNER SERVICE
// ═════════════════════════════════════════════════════════════════════════

let Platform;
try {
  Platform = require('react-native').Platform;
} catch (_) {
  Platform = { OS: 'android' };
}

let MediaLibrary;
try {
  MediaLibrary = require('expo-media-library/legacy');
} catch (_) {
  try {
    MediaLibrary = require('expo-media-library');
  } catch (e) {
    MediaLibrary = {};
  }
}

import { Id3Service } from './id3Service.js';
import { StorageService } from './storageService.js';

const AUDIO_EXTENSIONS = [
  '.mp3', '.m4a', '.wav', '.flac', '.aac', '.ogg', '.opus', 
  '.wma', '.aiff', '.m4p', '.alac', '.weba', '.mid', '.midi', '.amr', '.3gp'
];

/**
 * Requests and verifies device media permissions for audio scanning.
 * On Android 13+ / Expo Go, strictly requests 'audio' granular permission
 * to avoid Expo Go's security exception on photo/video permissions.
 */
export async function requestAudioPermissions() {
  try {
    if (!MediaLibrary || typeof MediaLibrary.getPermissionsAsync !== 'function') {
      return false;
    }

    let perm = null;

    if (Platform.OS === 'android') {
      // Step 1: Check existing permission with granular ['audio']
      try {
        perm = await MediaLibrary.getPermissionsAsync(false, ['audio']);
      } catch (err1) {
        // Fallback without arguments for older versions
        try {
          perm = await MediaLibrary.getPermissionsAsync();
        } catch (_) {}
      }

      if (perm && (perm.granted || perm.status === 'granted')) {
        return true;
      }

      // Step 2: Request permission with granular ['audio']
      try {
        perm = await MediaLibrary.requestPermissionsAsync(false, ['audio']);
      } catch (err2) {
        try {
          perm = await MediaLibrary.requestPermissionsAsync();
        } catch (_) {}
      }

      if (perm && (perm.granted || perm.status === 'granted')) {
        return true;
      }

      // Fallback attempt without arguments for standard Android storage
      try {
        const genericPerm = await MediaLibrary.requestPermissionsAsync();
        if (genericPerm && (genericPerm.granted || genericPerm.status === 'granted')) {
          return true;
        }
      } catch (_) {}
    } else {
      // iOS
      try {
        perm = await MediaLibrary.getPermissionsAsync();
      } catch (_) {}
      if (!perm || (!perm.granted && perm.status !== 'granted')) {
        try {
          perm = await MediaLibrary.requestPermissionsAsync();
        } catch (_) {}
      }
    }

    return Boolean(perm && (perm.granted || perm.status === 'granted'));
  } catch (err) {
    console.log('Audio permission request notice:', err);
    return false;
  }
}

/**
 * Automatically scans device storage for all MP3, M4A, WAV, FLAC, and audio tracks.
 * Returns enriched track objects ready for Selah player.
 */
export async function scanDeviceAudio(maxPages = 20, pageSize = 100) {
  const hasPermission = await requestAudioPermissions();
  if (!hasPermission) {
    return { success: false, tracks: [], error: 'Permission not granted' };
  }

  const discovered = [];
  const seenUris = new Set();
  let hasNextPage = true;
  let after = undefined;
  let page = 0;

  try {
    if (typeof MediaLibrary.getAssetsAsync !== 'function') {
      return { success: false, tracks: [], error: 'getAssetsAsync not available' };
    }

    const audioType = MediaLibrary.MediaType?.audio || 'audio';
    const mediaTypesToQuery = [audioType];
    if (MediaLibrary.MediaType?.unknown) {
      mediaTypesToQuery.push(MediaLibrary.MediaType.unknown);
    }

    // ── PASS 1: Scan Audio Media Assets with Pagination ──
    while (hasNextPage && page < maxPages) {
      page++;
      const options = {
        mediaType: mediaTypesToQuery,
        first: pageSize
      };
      if (after) {
        options.after = String(after);
      }

      const res = await MediaLibrary.getAssetsAsync(options);
      if (res && res.assets && res.assets.length > 0) {
        for (const asset of res.assets) {
          const uri = asset.uri || asset.id;
          const fname = (asset.filename || asset.uri || '').toLowerCase();
          const isAudioMatch = 
            asset.mediaType === 'audio' || 
            AUDIO_EXTENSIONS.some(ext => fname.endsWith(ext));

          if (uri && isAudioMatch && !seenUris.has(uri)) {
            seenUris.add(uri);
            discovered.push(Id3Service.enrichAsset(asset));
          }
        }
      }

      hasNextPage = Boolean(res && res.hasNextPage && res.endCursor && res.endCursor !== after);
      after = res?.endCursor;
      if (!res?.assets || res.assets.length === 0) break;
    }

    // ── PASS 2: Scan Audio Folders/Albums (Music, Download, WhatsApp, Recordings) ──
    try {
      if (typeof MediaLibrary.getAlbumsAsync === 'function') {
        const albums = await MediaLibrary.getAlbumsAsync();
        if (Array.isArray(albums) && albums.length > 0) {
          const targetAlbumKeywords = ['music', 'download', 'audio', 'song', 'record', 'podcast', 'track'];
          const relevantAlbums = albums.filter(a => {
            const title = (a.title || '').toLowerCase();
            return targetAlbumKeywords.some(k => title.includes(k));
          });

          for (const album of relevantAlbums.slice(0, 8)) {
            try {
              const albumAssets = await MediaLibrary.getAssetsAsync({
                album: album.id,
                first: 100,
                mediaType: mediaTypesToQuery
              });
              if (albumAssets && albumAssets.assets) {
                for (const asset of albumAssets.assets) {
                  const uri = asset.uri || asset.id;
                  const fname = (asset.filename || asset.uri || '').toLowerCase();
                  const isAudioMatch = 
                    asset.mediaType === 'audio' || 
                    AUDIO_EXTENSIONS.some(ext => fname.endsWith(ext));

                  if (uri && isAudioMatch && !seenUris.has(uri)) {
                    seenUris.add(uri);
                    const enriched = Id3Service.enrichAsset(asset);
                    if (!enriched.folder || enriched.folder === 'Music') {
                      enriched.folder = album.title || 'Music';
                    }
                    discovered.push(enriched);
                  }
                }
              }
            } catch (_) {}
          }
        }
      }
    } catch (albumErr) {
      console.log('Album inspection notice:', albumErr);
    }

    // ── PASS 3: Secondary scan fallback across all media assets ──
    if (discovered.length === 0) {
      try {
        const fallbackRes = await MediaLibrary.getAssetsAsync({ 
          first: 300,
          mediaType: [MediaLibrary.MediaType?.audio || 'audio', MediaLibrary.MediaType?.unknown || 'unknown']
        });
        if (fallbackRes && fallbackRes.assets) {
          for (const asset of fallbackRes.assets) {
            const fname = (asset.filename || asset.uri || '').toLowerCase();
            if (AUDIO_EXTENSIONS.some(ext => fname.endsWith(ext))) {
              const uri = asset.uri || asset.id;
              if (uri && !seenUris.has(uri)) {
                seenUris.add(uri);
                discovered.push(Id3Service.enrichAsset(asset));
              }
            }
          }
        }
      } catch (fbErr) {
        console.log('Secondary media fallback notice:', fbErr);
      }
    }

    return { success: true, tracks: discovered };
  } catch (err) {
    console.error('Scan device audio error:', err);
    return { success: false, tracks: discovered, error: err.message };
  }
}

export const ScannerService = {
  requestAudioPermissions,
  scanDeviceAudio
};

export default ScannerService;
