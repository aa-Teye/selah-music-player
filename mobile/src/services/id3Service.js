/**
 * ID3 Tag & Audio Metadata Parser for Selah Music Player
 * Parses ID3v2 tags (TIT2, TPE1, TALB, APIC) and cleans filenames
 */

export const Id3Service = {
  /**
   * Parse clean title and artist from filename
   * Supports standard conventions:
   * - "Artist - Title.mp3"
   * - "01. Artist - Title.mp3"
   * - "Title (Feat. Artist).mp3"
   */
  parseFilenameMetadata(rawFilename) {
    if (!rawFilename) return { title: 'Unknown Audio', artist: 'Device Storage', album: 'My Music' };

    // Remove file extension
    let clean = rawFilename.replace(/\.[^/.]+$/, "").trim();

    // Remove leading track numbers (e.g. "01 - ", "1. ", "02_")
    clean = clean.replace(/^\d+[\s.-_]+/, "").trim();

    let title = clean;
    let artist = "Device Storage";
    let album = "My Music Files";

    // Check for "Artist - Title" pattern
    if (clean.includes(' - ')) {
      const parts = clean.split(' - ');
      if (parts.length >= 2) {
        artist = parts[0].trim();
        title = parts.slice(1).join(' - ').trim();
      }
    } else if (clean.includes(' _ ')) {
      const parts = clean.split(' _ ');
      if (parts.length >= 2) {
        artist = parts[0].trim();
        title = parts.slice(1).join(' _ ').trim();
      }
    }

    return {
      title: title || 'Audio Track',
      artist: artist || 'Device Storage',
      album: album
    };
  },

  /**
   * Determine thematic cover artwork based on song title and artist
   * If embedded tag is missing, matches gospel/worship aesthetic dynamically
   */
  generateCuratedArtwork(title = '', artist = '') {
    const combined = `${title} ${artist}`.toLowerCase();

    if (combined.includes('worship') || combined.includes('praise') || combined.includes('god') || combined.includes('lord')) {
      return "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=500&q=80"; // Worship crowd/light
    }
    if (combined.includes('peace') || combined.includes('still') || combined.includes('ocean') || combined.includes('calm')) {
      return "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=500&q=80"; // Peaceful ocean
    }
    if (combined.includes('lofi') || combined.includes('chill') || combined.includes('study') || combined.includes('prayer')) {
      return "https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=500&q=80"; // Lo-fi sunrise Bible
    }
    if (combined.includes('acoustic') || combined.includes('guitar') || combined.includes('strings')) {
      return "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=500&q=80"; // Acoustic guitar
    }
    if (combined.includes('gospel') || combined.includes('choir') || combined.includes('joy')) {
      return "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=500&q=80"; // Soulful warm stage
    }

    // Default warm golden studio artwork
    return "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=500&q=80";
  },

  /**
   * Enriches scanned audio asset into full Selah track object
   */
  enrichAsset(asset) {
    const filename = asset.filename || 'Audio Track.mp3';
    const parsed = this.parseFilenameMetadata(filename);

    // Extract folder name from uri if present
    let folderName = 'Internal Storage';
    if (asset.uri) {
      const parts = decodeURIComponent(asset.uri).split('/');
      if (parts.length > 2) {
        // Parent folder
        folderName = parts[parts.length - 2] || 'Music';
      }
    }

    const coverUrl = this.generateCuratedArtwork(parsed.title, parsed.artist);

    return {
      id: `local-scan-${asset.id}`,
      title: parsed.title,
      artist: parsed.artist,
      album: parsed.album,
      folder: folderName,
      duration: Math.round(asset.duration || 180),
      category: "local",
      sourceType: "local",
      uri: asset.uri,
      coverUrl: coverUrl,
      lyrics: `[Device Audio: ${parsed.title}]\nArtist: ${parsed.artist}\nStored in: ${folderName}\nOffline playback from your phone.`
    };
  }
};
