/* Tiny fake audio files, built byte by byte, for testing the song-details reader. */
const latin1 = (s) => Array.from(Buffer.from(s, 'latin1'));
const utf8 = (s) => Array.from(Buffer.from(s, 'utf8'));
const utf16le = (s) => Array.from(Buffer.from(s, 'utf16le'));
const be32 = (n) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
const le32 = (n) => [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255];
const le16 = (n) => [n & 255, (n >>> 8) & 255];
const synch = (n) => [(n >> 21) & 127, (n >> 14) & 127, (n >> 7) & 127, n & 127];
const zeros = (n) => new Array(n).fill(0);

function id3Frame(id, data) {
  return [...latin1(id), ...be32(data.length), 0, 0, ...data];
}

/** MP3 with ID3v2.3 title (UTF-16), artist, album (UTF-8), lyrics, and a VBR frame header with 1000 frames */
function mp3WithTags() {
  const frames = [
    ...id3Frame('TIT2', [1, 0xff, 0xfe, ...utf16le('Way Maker')]),
    ...id3Frame('TPE1', [0, ...latin1('Sinach')]),
    ...id3Frame('TALB', [3, ...utf8('Ọlọ́run Worship')]),
    ...id3Frame('USLT', [0, ...latin1('eng'), 0, ...latin1('You are here\nmoving in our midst')])
  ];
  const tag = [...latin1('ID3'), 3, 0, 0, ...synch(frames.length + 32), ...frames, ...zeros(32)];
  const frameHeader = [0xff, 0xfb, 0x90, 0x00];
  const xing = [...latin1('Xing'), ...be32(1), ...be32(1000)];
  const frame = [...frameHeader, ...zeros(32), ...xing, ...zeros(400)];
  return Uint8Array.from([...tag, ...frame]);
}

/** MP3 with only an old ID3v1 tag at the end, constant 128 kbps */
function mp3WithId3v1() {
  const audio = [0xff, 0xfb, 0x90, 0x00, ...zeros(15996)];
  const pad = (s, n) => [...latin1(s), ...zeros(n - s.length)];
  const v1 = [...latin1('TAG'), ...pad('Imela', 30), ...pad('Nathaniel Bassey', 30), ...pad('Revival', 30), ...zeros(35)];
  return Uint8Array.from([...audio, ...v1]);
}

function box(type, body) {
  return [...be32(8 + body.length), ...latin1(type), ...body];
}

/** M4A with the "moov" details at the END (common for downloaded songs), 245 s long */
function m4aWithTags() {
  const data = (text) => box('data', [...be32(1), ...be32(0), ...utf8(text)]);
  const mvhd = box('mvhd', [0, 0, 0, 0, ...be32(0), ...be32(0), ...be32(1000), ...be32(245000), ...zeros(80)]);
  const ilst = box('ilst', [
    ...box('©nam', data('Goodness of God')),
    ...box('©ART', data('CeCe Winans')),
    ...box('©lyr', data('I love You, Lord\nFor Your mercy never fails me'))
  ]);
  const meta = box('meta', [0, 0, 0, 0, ...ilst]);
  const moov = box('moov', [...mvhd, ...box('udta', meta)]);
  const ftyp = box('ftyp', [...latin1('M4A '), ...be32(0), ...latin1('M4A ')]);
  const mdat = box('mdat', zeros(64));
  return Uint8Array.from([...ftyp, ...mdat, ...moov]);
}

/** FLAC, 200 s at 44.1 kHz, with title and artist */
function flacWithTags() {
  const rate = 44100;
  const total = rate * 200;
  const streamInfo = [
    ...zeros(10),
    (rate >> 12) & 255,
    (rate >> 4) & 255,
    ((rate & 15) << 4) | (1 << 1) | 0,
    (15 << 4) | 0,
    ...be32(total),
    ...zeros(16)
  ];
  const entries = ['TITLE=Excess Love', 'ARTIST=Mercy Chinwo'];
  const comments = [...le32(6), ...latin1('vendor'), ...le32(entries.length)];
  entries.forEach((e) => comments.push(...le32(utf8(e).length), ...utf8(e)));
  return Uint8Array.from([
    ...latin1('fLaC'),
    0x00, 0, 0, streamInfo.length, ...streamInfo,
    0x84, (comments.length >> 16) & 255, (comments.length >> 8) & 255, comments.length & 255, ...comments
  ]);
}

/** WAV, 3 seconds of CD-quality stereo (only the header is real) */
function wav3s() {
  const fmt = [...le16(1), ...le16(2), ...le32(44100), ...le32(176400), ...le16(4), ...le16(16)];
  return Uint8Array.from([
    ...latin1('RIFF'), ...le32(36), ...latin1('WAVE'),
    ...latin1('fmt '), ...le32(16), ...fmt,
    ...latin1('data'), ...le32(176400 * 3), ...zeros(64)
  ]);
}

/** Opus, 180 s */
function opus180s() {
  const head = [...latin1('OggS'), ...zeros(24), ...latin1('OpusHead'), 1, 2, ...le16(312), ...le32(48000), ...zeros(20)];
  const granule = 48000 * 180 + 312;
  const last = [...latin1('OggS'), 0, 4, ...le32(granule), ...le32(0), ...zeros(40)];
  return Uint8Array.from([...head, ...zeros(500), ...last]);
}

const memoryReader = (bytes) => ({ size: bytes.length, read: (o, l) => bytes.subarray(o, Math.min(bytes.length, o + l)) });

module.exports = { mp3WithTags, mp3WithId3v1, m4aWithTags, flacWithTags, wav3s, opus180s, memoryReader };
