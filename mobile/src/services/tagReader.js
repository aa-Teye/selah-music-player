// ═════════════════════════════════════════════════════════════════════════
//  SELAH — SONG DETAILS READER
//  Reads the real title, artist, album, length, lyrics and cover picture
//  that are stored inside audio files, so songs don't depend on file names.
//  Supports MP3 (ID3v2 / ID3v1), M4A/MP4, FLAC, WAV, OGG Vorbis and Opus.
// ═════════════════════════════════════════════════════════════════════════
import { File } from 'expo-file-system';

const MAX_TAG_BYTES = 1024 * 1024; // never read more than 1 MB of text details
export const MAX_PICTURE_BYTES = 4 * 1024 * 1024; // covers bigger than this are skipped

// ── byte helpers ───────────────────────────────────────────────────────────
const u32 = (b, o) => b[o] * 16777216 + (b[o + 1] << 16) + (b[o + 2] << 8) + b[o + 3];
const u24 = (b, o) => (b[o] << 16) + (b[o + 1] << 8) + b[o + 2];
const u16le = (b, o) => b[o] | (b[o + 1] << 8);
const u32le = (b, o) => b[o] + (b[o + 1] << 8) + (b[o + 2] << 16) + b[o + 3] * 16777216;
const synchsafe = (b, o) => (b[o] << 21) | (b[o + 1] << 14) | (b[o + 2] << 7) | b[o + 3];
const ascii = (b, o, n) => {
  let s = '';
  for (let i = 0; i < n && o + i < b.length; i++) s += String.fromCharCode(b[o + i]);
  return s;
};

function decodeLatin1(b) {
  let s = '';
  for (let i = 0; i < b.length; i++) {
    if (b[i] === 0) break;
    s += String.fromCharCode(b[i]);
  }
  return s;
}

function decodeUtf8(b) {
  let s = '';
  let i = 0;
  while (i < b.length) {
    const c = b[i++];
    if (c === 0) break;
    if (c < 0x80) s += String.fromCharCode(c);
    else if (c >= 0xc0 && c < 0xe0) s += String.fromCharCode(((c & 0x1f) << 6) | (b[i++] & 0x3f));
    else if (c >= 0xe0 && c < 0xf0) {
      s += String.fromCharCode(((c & 0x0f) << 12) | ((b[i++] & 0x3f) << 6) | (b[i++] & 0x3f));
    } else if (c >= 0xf0) {
      const cp = ((c & 0x07) << 18) | ((b[i++] & 0x3f) << 12) | ((b[i++] & 0x3f) << 6) | (b[i++] & 0x3f);
      s += String.fromCodePoint(cp);
    }
  }
  return s;
}

function decodeUtf16(b, bigEndian) {
  let i = 0;
  let be = bigEndian;
  if (b.length >= 2 && b[0] === 0xff && b[1] === 0xfe) {
    be = false;
    i = 2;
  } else if (b.length >= 2 && b[0] === 0xfe && b[1] === 0xff) {
    be = true;
    i = 2;
  }
  let s = '';
  for (; i + 1 < b.length; i += 2) {
    const code = be ? (b[i] << 8) | b[i + 1] : b[i] | (b[i + 1] << 8);
    if (code === 0) break;
    s += String.fromCharCode(code);
  }
  return s;
}

function decodeText(encoding, b) {
  if (encoding === 1) return decodeUtf16(b, false);
  if (encoding === 2) return decodeUtf16(b, true);
  if (encoding === 3) return decodeUtf8(b);
  return decodeLatin1(b);
}

const tidy = (s) => String(s || '').replace(/\u0000/g, '').replace(/\s+/g, ' ').trim();

// A "reader" over bytes already in memory, and over one part of another reader
const memReader = (b) => ({ size: b.length, read: (o, l) => b.subarray(o, Math.min(b.length, o + l)) });
const subReader = (reader, offset, length) => ({
  size: length,
  read: (o, l) => reader.read(offset + o, Math.max(0, Math.min(l, length - o)))
});

// Undo ID3 "unsynchronisation" (every 0xFF 0x00 was written for a plain 0xFF)
function unsync(b) {
  const out = new Uint8Array(b.length);
  let n = 0;
  for (let i = 0; i < b.length; i++) {
    out[n++] = b[i];
    if (b[i] === 0xff && b[i + 1] === 0x00) i++;
  }
  return out.subarray(0, n);
}

// ── Cover pictures ─────────────────────────────────────────────────────────
/** The kind of picture these bytes hold, judged by their first bytes ('' if not a picture). */
export function imageType(b) {
  if (!b || b.length < 12) return '';
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg';
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'png';
  if (ascii(b, 0, 4) === 'GIF8') return 'gif';
  if (ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 4) === 'WEBP') return 'webp';
  if (b[0] === 0x42 && b[1] === 0x4d) return 'bmp';
  return '';
}

// Keep the best picture: the front cover (kind 3) if there is one, otherwise the first
function offerPicture(out, data, kind) {
  const type = imageType(data);
  if (!type) return;
  const front = kind === 3;
  if (!out.picture || (front && !out.picture.front)) out.picture = { data, type, front };
}

// Skips a text that ends with a zero (two zero bytes for UTF-16)
function skipText(data, p, encoding) {
  if (encoding === 1 || encoding === 2) {
    while (p + 1 < data.length && !(data[p] === 0 && data[p + 1] === 0)) p += 2;
    return p + 2;
  }
  while (p < data.length && data[p] !== 0) p++;
  return p + 1;
}

// APIC (ID3v2.3/2.4) or PIC (ID3v2.2): encoding, format, kind, description, picture
function parsePictureFrame(out, data, v22) {
  const encoding = data[0];
  let p = 1;
  if (v22) p += 3;
  else p = skipText(data, p, 0);
  const formatEnd = p;
  const kind = data[p];
  p = skipText(data, p + 1, encoding);
  let picture = data.subarray(p);
  if (!imageType(picture)) {
    // Some apps write the description wrongly: look for the picture's first bytes nearby
    for (let i = formatEnd; i < Math.min(data.length - 12, formatEnd + 300); i++) {
      if (imageType(data.subarray(i, i + 12))) {
        picture = data.subarray(i);
        break;
      }
    }
  }
  offerPicture(out, picture, kind);
}

// ── MP3: ID3v2 tags ────────────────────────────────────────────────────────
const ID3_FRAMES = {
  TIT2: 'title',
  TT2: 'title',
  TPE1: 'artist',
  TP1: 'artist',
  TPE2: 'albumArtist',
  TP2: 'albumArtist',
  TALB: 'album',
  TAL: 'album',
  TLEN: 'length',
  TLE: 'length',
  USLT: 'lyrics',
  ULT: 'lyrics'
};

// Unsynced lyrics: encoding, 3-letter language, description, then the lyrics
function parseUslt(data) {
  const enc = data[0];
  let p = 4;
  const wide = enc === 1 || enc === 2;
  while (p < data.length) {
    if (wide) {
      if (data[p] === 0 && data[p + 1] === 0) {
        p += 2;
        break;
      }
      p += 2;
    } else {
      if (data[p] === 0) {
        p += 1;
        break;
      }
      p += 1;
    }
  }
  if (wide) {
    // decode the whole rest (keeps line breaks); a BOM may start the text again
    let text = '';
    let be = enc === 2;
    let i = p;
    if (data[i] === 0xff && data[i + 1] === 0xfe) {
      be = false;
      i += 2;
    } else if (data[i] === 0xfe && data[i + 1] === 0xff) {
      be = true;
      i += 2;
    }
    for (; i + 1 < data.length; i += 2) {
      const code = be ? (data[i] << 8) | data[i + 1] : data[i] | (data[i + 1] << 8);
      if (code === 0) break;
      text += String.fromCharCode(code);
    }
    return text;
  }
  return enc === 3 ? decodeUtf8(data.subarray(p)) : decodeLatin1(data.subarray(p));
}

/**
 * Reads an ID3v2 tag frame by frame, so a huge picture never has to be loaded
 * just to get to the title behind it.
 */
function parseId3v2Reader(reader, wantPicture) {
  const out = {};
  const h = reader.read(0, 10);
  if (h.length < 10 || ascii(h, 0, 3) !== 'ID3') return out;
  const ver = h[3];
  if (ver < 2 || ver > 4) return out;
  const flags = h[5];
  let end = Math.min(reader.size, 10 + synchsafe(h, 6));
  let src = reader;
  if (flags & 0x80 && ver < 4) {
    // Older tags can be "unsynchronised" as a whole: undo that in memory first
    const raw = reader.read(0, Math.min(end, MAX_PICTURE_BYTES));
    const body = unsync(raw.subarray(10));
    const joined = new Uint8Array(10 + body.length);
    joined.set(raw.subarray(0, 10), 0);
    joined.set(body, 10);
    src = memReader(joined);
    end = joined.length;
  }
  let pos = 10;
  if (flags & 0x40) {
    const x = src.read(10, 4); // extended header
    pos += ver === 4 ? synchsafe(x, 0) : u32(x, 0) + 4;
  }
  const idLen = ver === 2 ? 3 : 4;
  const headerLen = ver === 2 ? 6 : 10;

  for (let guard = 0; pos + headerLen <= end && guard < 512; guard++) {
    const fh = src.read(pos, headerLen);
    const id = ascii(fh, 0, idLen);
    if (!/^[A-Z0-9]+$/.test(id)) break; // padding
    const size = ver === 2 ? u24(fh, 3) : ver === 4 ? synchsafe(fh, 4) : u32(fh, 4);
    const start = pos + headerLen;
    const stop = start + size;
    if (!(size > 0) || stop > end) break;
    pos = stop;

    const key = ID3_FRAMES[id];
    const isPicture = id === 'APIC' || id === 'PIC';
    if (isPicture ? !wantPicture || size > MAX_PICTURE_BYTES : !key || size > MAX_TAG_BYTES) continue;
    if (key && key !== 'length' && out[key]) continue; // already have it

    let data = src.read(start, size);
    if (ver === 3) {
      const fmt = fh[9];
      if (fmt & 0xc0) continue; // compressed or encrypted
      if (fmt & 0x20) data = data.subarray(1); // group byte
    } else if (ver === 4) {
      const fmt = fh[9];
      if (fmt & 0x0c) continue; // compressed or encrypted
      if (fmt & 0x40) data = data.subarray(1); // group byte
      if (fmt & 0x01) data = data.subarray(4); // stored length
      if (fmt & 0x02 || flags & 0x80) data = unsync(data);
    }

    if (isPicture) {
      parsePictureFrame(out, data, ver === 2);
    } else if (key === 'lyrics') {
      out.lyrics = parseUslt(data);
    } else if (key === 'length') {
      const ms = parseInt(tidy(decodeText(data[0], data.subarray(1))), 10);
      if (ms > 0) out.duration = ms / 1000;
    } else {
      out[key] = tidy(decodeText(data[0], data.subarray(1)));
    }
  }
  if (!out.artist && out.albumArtist) out.artist = out.albumArtist;
  delete out.albumArtist;
  return out;
}

export function parseId3v2(b, wantPicture = false) {
  return parseId3v2Reader(memReader(b), wantPicture);
}

export function parseId3v1(b) {
  if (b.length < 128 || ascii(b, 0, 3) !== 'TAG') return {};
  return {
    title: tidy(decodeLatin1(b.subarray(3, 33))),
    artist: tidy(decodeLatin1(b.subarray(33, 63))),
    album: tidy(decodeLatin1(b.subarray(63, 93)))
  };
}

// ── MP3: length from the audio frames ──────────────────────────────────────
const BITRATES = {
  V1L1: [0, 32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448],
  V1L2: [0, 32, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384],
  V1L3: [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320],
  V2L1: [0, 32, 48, 56, 64, 80, 96, 112, 128, 144, 160, 176, 192, 224, 256],
  V2L23: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160]
};
const SAMPLE_RATES = { 3: [44100, 48000, 32000], 2: [22050, 24000, 16000], 0: [11025, 12000, 8000] };

export function mp3Duration(reader, start) {
  const buf = reader.read(start, 65536);
  for (let i = 0; i + 4 < buf.length; i++) {
    if (buf[i] !== 0xff || (buf[i + 1] & 0xe0) !== 0xe0) continue;
    const verBits = (buf[i + 1] >> 3) & 3;
    const layerBits = (buf[i + 1] >> 1) & 3;
    const brIdx = buf[i + 2] >> 4;
    const srIdx = (buf[i + 2] >> 2) & 3;
    const channelMode = buf[i + 3] >> 6;
    if (verBits === 1 || layerBits === 0 || brIdx === 0 || brIdx === 15 || srIdx === 3) continue;

    const sampleRate = SAMPLE_RATES[verBits][srIdx];
    const layer = 4 - layerBits;
    const mpeg1 = verBits === 3;
    const table = mpeg1 ? `V1L${layer}` : layer === 1 ? 'V2L1' : 'V2L23';
    const bitrate = BITRATES[table][brIdx] * 1000;
    const samplesPerFrame = layer === 1 ? 384 : layer === 3 && !mpeg1 ? 576 : 1152;

    // Variable bitrate files carry a "Xing"/"Info" or "VBRI" header with the frame count
    const sideInfo = layer === 3 ? (mpeg1 ? (channelMode === 3 ? 17 : 32) : channelMode === 3 ? 9 : 17) : 0;
    const x = i + 4 + sideInfo;
    const xing = ascii(buf, x, 4);
    if ((xing === 'Xing' || xing === 'Info') && x + 12 <= buf.length && u32(buf, x + 4) & 1) {
      const frames = u32(buf, x + 8);
      if (frames > 0) return (frames * samplesPerFrame) / sampleRate;
    }
    if (ascii(buf, i + 36, 4) === 'VBRI' && i + 54 <= buf.length) {
      const frames = u32(buf, i + 50);
      if (frames > 0) return (frames * samplesPerFrame) / sampleRate;
    }
    // Constant bitrate
    return bitrate > 0 ? ((reader.size - (start + i)) * 8) / bitrate : 0;
  }
  return 0;
}

// ── M4A / MP4 ──────────────────────────────────────────────────────────────
const MP4_ITEMS = { '©nam': 'title', '©ART': 'artist', aART: 'albumArtist', '©alb': 'album', '©lyr': 'lyrics' };

export function parseMp4(reader, wantPicture = false) {
  const out = {};
  const walk = (start, end, depth) => {
    let pos = start;
    for (let guard = 0; pos + 8 <= end && guard < 512; guard++) {
      const h = reader.read(pos, 16);
      if (h.length < 8) break;
      let size = u32(h, 0);
      const type = ascii(h, 4, 4);
      let header = 8;
      if (size === 1 && h.length >= 16) {
        size = u32(h, 8) * 4294967296 + u32(h, 12);
        header = 16;
      } else if (size === 0) {
        size = end - pos;
      }
      if (!(size >= header)) break;
      const bodyStart = pos + header;
      const bodyEnd = Math.min(end, pos + size);
      if (type === 'moov' || type === 'udta' || type === 'ilst') {
        walk(bodyStart, bodyEnd, depth + 1);
      } else if (type === 'meta') {
        walk(bodyStart + 4, bodyEnd, depth + 1);
      } else if (type === 'mvhd') {
        const b = reader.read(bodyStart, 32);
        const v1 = b[0] === 1;
        const timescale = v1 ? u32(b, 20) : u32(b, 12);
        const duration = v1 ? u32(b, 24) * 4294967296 + u32(b, 28) : u32(b, 16);
        if (timescale > 0) out.duration = duration / timescale;
      } else if (MP4_ITEMS[type] && depth >= 3) {
        const b = reader.read(bodyStart, Math.min(bodyEnd - bodyStart, 262144));
        if (ascii(b, 4, 4) === 'data') {
          const key = MP4_ITEMS[type];
          if (!out[key]) {
            const text = decodeUtf8(b.subarray(16, Math.min(b.length, u32(b, 0))));
            out[key] = key === 'lyrics' ? text : tidy(text);
          }
        }
      } else if (type === 'covr' && wantPicture && depth >= 3) {
        const len = bodyEnd - bodyStart;
        if (len > 16 && len <= MAX_PICTURE_BYTES + 16) {
          const b = reader.read(bodyStart, len);
          if (ascii(b, 4, 4) === 'data') offerPicture(out, b.subarray(16, Math.min(b.length, u32(b, 0))), 3);
        }
      }
      pos += size;
    }
  };
  walk(0, reader.size, 0);
  if (!out.artist && out.albumArtist) out.artist = out.albumArtist;
  delete out.albumArtist;
  return out;
}

// ── FLAC ───────────────────────────────────────────────────────────────────
export function parseFlac(reader, wantPicture = false) {
  const out = {};
  let pos = 4;
  for (let n = 0; n < 64; n++) {
    const h = reader.read(pos, 4);
    if (h.length < 4) break;
    const last = h[0] & 0x80;
    const type = h[0] & 0x7f;
    const len = u24(h, 1);
    const body = pos + 4;
    if (type === 0) {
      const b = reader.read(body, 18);
      const sampleRate = (b[10] << 12) | (b[11] << 4) | (b[12] >> 4);
      const total = (b[13] & 0x0f) * 4294967296 + u32(b, 14);
      if (sampleRate > 0 && total > 0) out.duration = total / sampleRate;
    } else if (type === 4) {
      const b = reader.read(body, Math.min(len, MAX_TAG_BYTES));
      let p = 4 + u32le(b, 0);
      const count = u32le(b, p);
      p += 4;
      for (let i = 0; i < count && p + 4 <= b.length; i++) {
        const l = u32le(b, p);
        p += 4;
        const entry = decodeUtf8(b.subarray(p, p + l));
        p += l;
        const eq = entry.indexOf('=');
        if (eq <= 0) continue;
        const k = entry.slice(0, eq).toUpperCase();
        const v = entry.slice(eq + 1);
        if (k === 'TITLE' && !out.title) out.title = tidy(v);
        else if (k === 'ARTIST' && !out.artist) out.artist = tidy(v);
        else if (k === 'ALBUM' && !out.album) out.album = tidy(v);
        else if ((k === 'LYRICS' || k === 'UNSYNCEDLYRICS') && !out.lyrics) out.lyrics = v;
      }
    } else if (type === 6 && wantPicture && len <= MAX_PICTURE_BYTES) {
      // PICTURE: kind, format, description, width, height, depth, colours, then the picture
      const b = reader.read(body, len);
      const kind = u32(b, 0);
      let p = 8 + u32(b, 4);
      p += 4 + u32(b, p);
      p += 16;
      const size = u32(b, p);
      p += 4;
      if (size > 0 && p + size <= b.length) offerPicture(out, b.subarray(p, p + size), kind);
    }
    if (last) break;
    pos = body + len;
  }
  return out;
}

// ── WAV ────────────────────────────────────────────────────────────────────
export function parseWav(reader, wantPicture = false) {
  const out = {};
  let pos = 12;
  let byteRate = 0;
  for (let n = 0; n < 64 && pos + 8 <= reader.size; n++) {
    const c = reader.read(pos, 8);
    if (c.length < 8) break;
    const id = ascii(c, 0, 4);
    const len = u32le(c, 4);
    if (id === 'fmt ') {
      byteRate = u32le(reader.read(pos + 8, 16), 8);
    } else if (id === 'data') {
      if (byteRate > 0 && !out.duration) out.duration = len / byteRate;
    } else if (id === 'LIST' && len <= MAX_TAG_BYTES) {
      // INFO list: INAM = title, IART = artist, IPRD = album
      const b = reader.read(pos + 8, len);
      if (ascii(b, 0, 4) === 'INFO') {
        for (let p = 4; p + 8 <= b.length; ) {
          const sub = ascii(b, p, 4);
          const l = u32le(b, p + 4);
          const text = tidy(decodeUtf8(b.subarray(p + 8, p + 8 + l)));
          if (sub === 'INAM' && !out.title) out.title = text;
          else if (sub === 'IART' && !out.artist) out.artist = text;
          else if (sub === 'IPRD' && !out.album) out.album = text;
          p += 8 + l + (l % 2);
        }
      }
    } else if (id === 'id3 ' || id === 'ID3 ') {
      // Many apps store a normal MP3-style tag (with the cover) inside WAV files
      const tag = parseId3v2Reader(subReader(reader, pos + 8, Math.min(len, reader.size - pos - 8)), wantPicture);
      Object.keys(tag).forEach((k) => {
        if (out[k] === undefined) out[k] = tag[k];
      });
    }
    pos += 8 + len + (len % 2);
  }
  return out;
}

// ── OGG Vorbis / Opus ──────────────────────────────────────────────────────
export function parseOgg(reader) {
  const head = reader.read(0, 4096);
  const headText = ascii(head, 0, head.length);
  let rate = 0;
  let preSkip = 0;
  const opus = headText.indexOf('OpusHead');
  if (opus >= 0) {
    rate = 48000;
    preSkip = u16le(head, opus + 10);
  } else {
    const vorbis = headText.indexOf('\u0001vorbis');
    if (vorbis >= 0) rate = u32le(head, vorbis + 12);
  }
  if (!rate) return {};
  const tailLen = Math.min(reader.size, 65536);
  const tail = reader.read(reader.size - tailLen, tailLen);
  const lastPage = ascii(tail, 0, tail.length).lastIndexOf('OggS');
  if (lastPage < 0) return {};
  const granule = u32le(tail, lastPage + 6) + u32le(tail, lastPage + 10) * 4294967296;
  return granule > preSkip ? { duration: (granule - preSkip) / rate } : {};
}

// ── Main ───────────────────────────────────────────────────────────────────
const extOf = (uri) => {
  const m = String(uri || '').split('?')[0].match(/\.([a-z0-9]{1,5})$/i);
  return m ? m[1].toLowerCase() : '';
};
const MP3_EXTS = ['mp3', 'mp2', 'mpga'];

/**
 * Reads details from any "reader" ({ size, read(offset, length) -> Uint8Array }).
 * Returns { title?, artist?, album?, duration? (seconds), lyrics?, picture? }.
 * The cover picture ({ data, type }) is only read when options.picture is true.
 */
export function readTagsFromReader(reader, ext, options = {}) {
  const wantPicture = Boolean(options.picture);
  let out = {};
  const head = reader.read(0, 12);
  if (ascii(head, 0, 3) === 'ID3') {
    const tagSize = synchsafe(head, 6) + 10;
    out = parseId3v2Reader(reader, wantPicture);
    if (!out.duration && MP3_EXTS.includes(ext)) out.duration = mp3Duration(reader, tagSize);
  } else if (ascii(head, 4, 4) === 'ftyp') {
    out = parseMp4(reader, wantPicture);
  } else if (ascii(head, 0, 4) === 'fLaC') {
    out = parseFlac(reader, wantPicture);
  } else if (ascii(head, 0, 4) === 'RIFF' && ascii(head, 8, 4) === 'WAVE') {
    out = parseWav(reader, wantPicture);
  } else if (ascii(head, 0, 4) === 'OggS') {
    out = parseOgg(reader);
  } else if (MP3_EXTS.includes(ext)) {
    out.duration = mp3Duration(reader, 0);
  }

  if (MP3_EXTS.includes(ext) && (!out.title || !out.artist) && reader.size > 128) {
    const v1 = parseId3v1(reader.read(reader.size - 128, 128));
    out.title = out.title || v1.title;
    out.artist = out.artist || v1.artist;
    out.album = out.album || v1.album;
  }

  const result = {};
  ['title', 'artist', 'album'].forEach((k) => {
    const v = tidy(out[k]).slice(0, 200);
    if (v) result[k] = v;
  });
  if (out.duration > 0 && isFinite(out.duration)) result.duration = Math.round(out.duration);
  const lyrics = String(out.lyrics || '').replace(/\r\n?/g, '\n').trim();
  if (lyrics) result.lyrics = lyrics.slice(0, 20000);
  if (wantPicture && out.picture) result.picture = { data: out.picture.data, type: out.picture.type };
  return result;
}

/** Reads the details stored inside an audio file. Returns null if the file can't be read. */
export function readTags(uri, options = {}) {
  let handle = null;
  try {
    const file = new File(uri);
    handle = file.open();
    const size = handle.size || file.size || 0;
    if (!size) return null;
    const reader = {
      size,
      read(offset, length) {
        const start = Math.max(0, Math.floor(offset));
        const len = Math.max(0, Math.min(length, size - start));
        if (len <= 0) return new Uint8Array(0);
        handle.offset = start;
        return handle.readBytesSync(len);
      }
    };
    return readTagsFromReader(reader, extOf(uri), options);
  } catch {
    return null;
  } finally {
    try {
      if (handle) handle.close();
    } catch {}
  }
}

export const TagReader = { readTags, readTagsFromReader };
export default TagReader;
