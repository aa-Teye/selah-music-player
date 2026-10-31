// ═════════════════════════════════════════════════════════════════════════
//  SELAH MUSIC PLAYER — DIRECT YOUTUBE SEARCH & STREAMING SERVICE
// ═════════════════════════════════════════════════════════════════════════

const DESKTOP_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * Extracts a YouTube Video ID from any standard link, short link, or raw ID.
 */
export function extractVideoId(input) {
  if (!input) return null;
  const str = String(input).trim();
  const match = str.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
  if (match) return match[1];
  if (/^[\w-]{11}$/.test(str)) return str;
  return null;
}

/**
 * Parses time strings like "3:45" or "1:02:10" into total seconds.
 */
function parseDurationToSeconds(str) {
  if (!str) return 210;
  const parts = String(str).split(':').map(Number);
  if (parts.some(isNaN)) return 210;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 210;
}

/**
 * Searches YouTube directly and parses live search results without requiring an API key.
 * Compatible with React Native fetch and Node.js.
 */
export async function searchYouTube(query, maxResults = 25) {
  if (!query || !query.trim()) return [];
  const cleanQuery = query.trim();

  try {
    const encodedQuery = encodeURIComponent(cleanQuery);
    const searchUrl = `https://www.youtube.com/results?search_query=${encodedQuery}`;

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': DESKTOP_UA,
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    if (!response.ok) {
      console.warn('YouTube search request returned status:', response.status);
      return [];
    }

    const html = await response.text();

    // Match ytInitialData embedded JSON
    const jsonMatch = html.match(/var ytInitialData = ({.*?});<\/script>/s) || 
                      html.match(/ytInitialData\s*=\s*({.+?});/s);

    if (!jsonMatch) {
      return [];
    }

    const data = JSON.parse(jsonMatch[1]);
    const results = [];
    const seenIds = new Set();

    // Recursive traversal to collect all videoRenderers across sections and shelves
    function walk(node) {
      if (!node || typeof node !== 'object') return;

      if (node.videoRenderer) {
        const v = node.videoRenderer;
        const videoId = v.videoId;

        if (videoId && !seenIds.has(videoId)) {
          seenIds.add(videoId);

          const title = v.title?.runs?.map(r => r.text).join('') || v.title?.simpleText || 'YouTube Video';
          const artist = v.ownerText?.runs?.map(r => r.text).join('') || 
                         v.shortBylineText?.runs?.map(r => r.text).join('') || 
                         'YouTube';
          const durationFormatted = v.lengthText?.simpleText || '3:30';
          const duration = parseDurationToSeconds(durationFormatted);

          results.push({
            id: `yt-${videoId}`,
            title,
            artist,
            album: 'YouTube Watch',
            duration,
            durationFormatted,
            youtubeId: videoId,
            sourceType: 'youtube',
            coverUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
            lyrics: `[Streaming from YouTube: ${videoId}]`
          });
        }
        return;
      }

      if (Array.isArray(node)) {
        for (let i = 0; i < node.length; i++) {
          walk(node[i]);
          if (results.length >= maxResults) return;
        }
      } else {
        const keys = Object.keys(node);
        for (let i = 0; i < keys.length; i++) {
          walk(node[keys[i]]);
          if (results.length >= maxResults) return;
        }
      }
    }

    walk(data.contents);
    return results.slice(0, maxResults);
  } catch (err) {
    console.error('Failed to search YouTube:', err);
    return [];
  }
}

/**
 * Gets query autocomplete suggestions directly from YouTube.
 */
export async function getYouTubeSuggestions(query) {
  if (!query || query.trim().length < 2) return [];
  try {
    const encoded = encodeURIComponent(query.trim());
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encoded}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data[1]) ? data[1] : [];
  } catch (_) {
    return [];
  }
}

export const YouTubeService = {
  extractVideoId,
  searchYouTube,
  getYouTubeSuggestions
};

export default YouTubeService;
