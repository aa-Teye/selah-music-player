export const DAILY_DEVOTION = {
  streakDays: 14,
  verse: "“The Lord is my strength and my shield; in him my heart trusts, and I am helped; my heart exults, and with my song I give thanks to him.”",
  reference: "Psalm 28:7 (ESV)",
  reflection: "Music is a vessel of thanksgiving. Whatever storm you are walking through today, let melody re-anchor your spirit in peace.",
  featuredTrackId: "track-1"
};

// Clean modern mood tags without emojis
export const MOOD_TAGS = [
  { id: "all", label: "All Songs" },
  { id: "worship", label: "Worship & Praise" },
  { id: "peace", label: "Peace & Calming" },
  { id: "focus", label: "Deep Focus" },
  { id: "joy", label: "Joy & Energy" },
  { id: "acoustic", label: "Acoustic & Strings" },
  { id: "lofi", label: "Lo-Fi Beats" }
];

// Initial tracks with fast-loading streaming audio URLs
export const INITIAL_TRACKS = [
  {
    id: "track-1",
    title: "Gratitude (Acoustic Reflection)",
    artist: "Brandon Lake",
    album: "House of Miracles",
    duration: 182,
    category: "worship",
    sourceType: "stream",
    uri: "https://cdn.jsdelivr.net/gh/rafaelreis-hotmart/Audio-Sample-files@master/sample.mp3",
    youtubeId: "dQ3Cj8-7M3Y",
    coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80",
    lyrics: `All my words fall short\nI got nothing new\nHow could I express\nAll my gratitude?\n\nSo I throw up my hands\nAnd praise You again and again\n'Cause all that I have is a hallelujah, hallelujah\nAnd I know it's not much\nBut I've nothing else fit for a King\nExcept for a heart singing hallelujah`
  },
  {
    id: "track-2",
    title: "Oceans (Where Feet May Fail)",
    artist: "Hillsong UNITED",
    album: "ZION",
    duration: 135,
    category: "peace",
    sourceType: "stream",
    uri: "https://cdn.jsdelivr.net/gh/rafaelreis-hotmart/Audio-Sample-files@master/sample2.mp3",
    youtubeId: "6XX7d_jX6Z8",
    coverUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
    lyrics: `You call me out upon the waters\nThe great unknown where feet may fail\nAnd there I find You in the mystery\nIn oceans deep, my faith will stand\n\nAnd I will call upon Your name\nAnd keep my eyes above the waves\nWhen oceans rise, my soul will rest in Your embrace\nFor I am Yours and You are mine`
  },
  {
    id: "track-3",
    title: "Peaceful Mind & Lo-Fi Beats",
    artist: "Sunday Chill Sessions",
    album: "Peaceful Mind Vol. 1",
    duration: 45,
    category: "lofi",
    sourceType: "stream",
    uri: "https://cdn.jsdelivr.net/gh/rafaelreis-hotmart/Audio-Sample-files@master/sample.wav",
    youtubeId: "jfKfPfyJRdk",
    coverUrl: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=600&q=80",
    lyrics: `[Peaceful Instrumental Lo-Fi Melody]\nWarm vinyl crackle with calming Rhodes chords for Bible study, meditation, and focused work.`
  },
  {
    id: "track-4",
    title: "Goodness of God",
    artist: "CeCe Winans",
    album: "Believe For It",
    duration: 182,
    category: "worship",
    sourceType: "stream",
    uri: "https://cdn.jsdelivr.net/gh/rafaelreis-hotmart/Audio-Sample-files@master/sample.mp3",
    youtubeId: "9sE5kEnitqE",
    coverUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=600&q=80",
    lyrics: `I love You, Lord\nFor Your mercy never fails me\nAll my days, I've been held in Your hands\nFrom the moment that I wake up\nUntil I lay my head\nOh, I will sing of the goodness of God`
  },
  {
    id: "track-5",
    title: "House of the Lord",
    artist: "Phil Wickham",
    album: "Hymn of Heaven",
    duration: 135,
    category: "joy",
    sourceType: "stream",
    uri: "https://cdn.jsdelivr.net/gh/rafaelreis-hotmart/Audio-Sample-files@master/sample2.mp3",
    youtubeId: "x0vQyN3jQbg",
    coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80",
    lyrics: `We sing to the God who heals\nWe sing to the God who saves\nWe sing to the God who always makes a way\n\n'Cause He hang the stars up in the sky\nAnd He has the power to raise the dead`
  }
];
