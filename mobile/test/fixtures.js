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

// ── Cover pictures ──────────────────────────────────────────────────────────
/** A small fake JPEG (Selah only checks the first bytes); it contains 0xFF bytes on purpose */
function jpeg(seed = 1, size = 300) {
  const out = [0xff, 0xd8, 0xff, 0xe0];
  for (let i = 0; i < size; i++) out.push(i % 50 === 7 ? 0xff : (i * 31 + seed * 17) & 255);
  out.push(0xff, 0xd9);
  return out;
}

function png(size = 200) {
  const out = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (let i = 0; i < size; i++) out.push(i % 40 === 3 ? 0xff : (i * 7) & 255);
  return out;
}

function apic(picture, kind = 3, { mime = 'image/jpeg', desc = 'Cover', encoding = 0 } = {}) {
  const description = encoding === 1 ? [0xff, 0xfe, ...utf16le(desc), 0, 0] : [...latin1(desc), 0];
  return [encoding, ...latin1(mime), 0, kind, ...description, ...picture];
}

const mp3Audio = () => [0xff, 0xfb, 0x90, 0x00, ...zeros(400)];

/** MP3 (ID3v2.3) with a back cover first, then the front cover (UTF-16 description) */
function mp3WithCovers(front, back) {
  const frames = [
    ...id3Frame('TIT2', [0, ...latin1('Jehovah Overdo')]),
    ...id3Frame('APIC', apic(back, 4, { desc: 'Back' })),
    ...id3Frame('APIC', apic(front, 3, { encoding: 1 })),
    ...id3Frame('TPE1', [0, ...latin1('Minister GUC')])
  ];
  return Uint8Array.from([...latin1('ID3'), 3, 0, 0, ...synch(frames.length), ...frames, ...mp3Audio()]);
}

const unsyncBytes = (arr) => arr.flatMap((x) => (x === 0xff ? [0xff, 0] : [x]));

/** ID3v2.4 frame; optionally "unsynchronised" with a stored length (as some taggers write) */
function id3v24Frame(id, data, unsync = false) {
  const body = unsync ? [...synch(data.length), ...unsyncBytes(data)] : data;
  return [...latin1(id), ...synch(body.length), 0, unsync ? 0x03 : 0, ...body];
}

function mp3v24WithCover(picture) {
  const frames = [
    ...id3v24Frame('TIT2', [3, ...utf8('Nara')]),
    ...id3v24Frame('APIC', apic(picture, 3, { mime: 'image/png' }), true)
  ];
  return Uint8Array.from([...latin1('ID3'), 4, 0, 0, ...synch(frames.length), ...frames, ...mp3Audio()]);
}

/** ID3v2.3 where the whole tag is "unsynchronised" */
function mp3UnsyncedTag(picture) {
  const frames = [...id3Frame('TIT2', [0, ...latin1('Odo Yewu')]), ...id3Frame('APIC', apic(picture))];
  const body = unsyncBytes(frames);
  return Uint8Array.from([...latin1('ID3'), 3, 0, 0x80, ...synch(body.length), ...body, ...mp3Audio()]);
}

/** Very old ID3v2.2 tag (3-letter frame names, PIC picture) */
function mp3v22WithCover(picture) {
  const frame = (id, data) => [...latin1(id), (data.length >> 16) & 255, (data.length >> 8) & 255, data.length & 255, ...data];
  const frames = [...frame('TT2', [0, ...latin1('Onise Iyanu')]), ...frame('PIC', [0, ...latin1('JPG'), 3, ...latin1('x'), 0, ...picture])];
  return Uint8Array.from([...latin1('ID3'), 2, 0, 0, ...synch(frames.length), ...frames, ...mp3Audio()]);
}

function concat(...parts) {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  parts.forEach((p) => {
    out.set(p, o);
    o += p.length;
  });
  return out;
}

/** A 5 MB cover stored BEFORE the title (too big to keep, but the title must still be found) */
function mp3WithHugeCover() {
  const big = new Uint8Array(5 * 1024 * 1024);
  big.set([0xff, 0xd8, 0xff, 0xe0]);
  const head = [0, ...latin1('image/jpeg'), 0, 3, 0];
  const frames = concat(
    [...latin1('APIC'), ...be32(head.length + big.length), 0, 0],
    head,
    big,
    id3Frame('TIT2', [0, ...latin1('Big Cover Song')])
  );
  return concat([...latin1('ID3'), 3, 0, 0, ...synch(frames.length)], frames, mp3Audio());
}

/** M4A with a cover ("covr") */
function m4aWithCover(picture) {
  const data = (text) => box('data', [...be32(1), ...be32(0), ...utf8(text)]);
  const ilst = box('ilst', [...box('©nam', data('Yesu Mo')), ...box('covr', box('data', [...be32(13), ...be32(0), ...picture]))]);
  const moov = box('moov', box('udta', box('meta', [0, 0, 0, 0, ...ilst])));
  return Uint8Array.from([...box('ftyp', [...latin1('M4A '), ...be32(0)]), ...moov, ...box('mdat', zeros(32))]);
}

/** FLAC with a PICTURE block */
function flacWithCover(picture) {
  const streamInfo = zeros(34);
  const block = [
    ...be32(3), ...be32(10), ...latin1('image/jpeg'), ...be32(4), ...latin1('Holy'),
    ...be32(500), ...be32(500), ...be32(24), ...be32(0), ...be32(picture.length), ...picture
  ];
  const len3 = (n) => [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return Uint8Array.from([
    ...latin1('fLaC'),
    0x00, ...len3(streamInfo.length), ...streamInfo,
    0x86, ...len3(block.length), ...block
  ]);
}

/** WAV with an INFO list (title, artist, album) and an MP3-style tag holding the cover */
function wavWithDetails(picture) {
  const item = (id, text) => {
    const b = [...utf8(text), 0];
    return [...latin1(id), ...le32(b.length), ...b, ...(b.length % 2 ? [0] : [])];
  };
  const info = [...latin1('INFO'), ...item('INAM', 'Bo Noo Ni'), ...item('IART', 'Joe Mettle'), ...item('IPRD', 'Love Never Fails')];
  const frames = id3Frame('APIC', apic(picture));
  const tag = [...latin1('ID3'), 3, 0, 0, ...synch(frames.length), ...frames];
  const chunk = (id, body) => [...latin1(id), ...le32(body.length), ...body, ...(body.length % 2 ? [0] : [])];
  const fmt = [...le16(1), ...le16(2), ...le32(44100), ...le32(176400), ...le16(4), ...le16(16)];
  const inner = [
    ...latin1('WAVE'),
    ...chunk('fmt ', fmt),
    ...chunk('LIST', info),
    ...chunk('id3 ', tag),
    ...latin1('data'), ...le32(176400 * 3), ...zeros(64)
  ];
  return Uint8Array.from([...latin1('RIFF'), ...le32(inner.length), ...inner]);
}

module.exports = {
  mp3WithTags,
  mp3WithId3v1,
  m4aWithTags,
  flacWithTags,
  wav3s,
  opus180s,
  memoryReader,
  jpeg,
  png,
  mp3WithCovers,
  mp3v24WithCover,
  mp3UnsyncedTag,
  mp3v22WithCover,
  mp3WithHugeCover,
  m4aWithCover,
  flacWithCover,
  wavWithDetails
};
