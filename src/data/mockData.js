export const DAILY_DEVOTION = {
  date: "Today's Inspiration",
  streakDays: 14,
  verse: "“The Lord is my strength and my shield; in him my heart trusts, and I am helped; my heart exults, and with my song I give thanks to him.”",
  reference: "Psalm 28:7 (ESV)",
  reflection: "Music is a vessel of thanksgiving. Whatever storm you are walking through today, let melody re-anchor your spirit in peace.",
  featuredTrackId: "track-1"
};

export const MOOD_TAGS = [
  { id: "all", label: "All Songs", icon: "✨" },
  { id: "worship", label: "Worship & Praise", icon: "🕊️" },
  { id: "peace", label: "Peace & Calming", icon: "🌿" },
  { id: "focus", label: "Deep Focus", icon: "🧠" },
  { id: "joy", label: "Joy & Energy", icon: "⚡" },
  { id: "acoustic", label: "Acoustic & Strings", icon: "🎸" },
  { id: "lofi", label: "Lo-Fi Beats", icon: "☕" }
];

export const INITIAL_TRACKS = [
  {
    id: "yt-1",
    title: "Gratitude (Live)",
    artist: "Brandon Lake",
    album: "House of Miracles",
    duration: 338, // seconds
    category: "worship",
    sourceType: "youtube",
    youtubeId: "dQ3Cj8-7M3Y",
    coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80",
    lyrics: `All my words fall short
I got nothing new
How could I express
All my gratitude?
I could sing these songs
As I often do
But every song must end
And You never do

So I throw up my hands
And praise You again and again
'Cause all that I have is a hallelujah, hallelujah
And I know it's not much
But I've nothing else fit for a King
Except for a heart singing hallelujah`
  },
  {
    id: "yt-2",
    title: "Oceans (Where Feet May Fail)",
    artist: "Hillsong UNITED",
    album: "ZION",
    duration: 536,
    category: "peace",
    sourceType: "youtube",
    youtubeId: "6XX7d_jX6Z8",
    coverUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
    lyrics: `You call me out upon the waters
The great unknown where feet may fail
And there I find You in the mystery
In oceans deep, my faith will stand

And I will call upon Your name
And keep my eyes above the waves
When oceans rise, my soul will rest in Your embrace
For I am Yours and You are mine`
  },
  {
    id: "yt-3",
    title: "Lo-Fi Worship & Study Beats",
    artist: "Sunday Chill Sessions",
    album: "Peaceful Mind Vol. 1",
    duration: 245,
    category: "lofi",
    sourceType: "youtube",
    youtubeId: "jfKfPfyJRdk", // lofi hip hop / instrumental
    coverUrl: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=600&q=80",
    lyrics: `[Instrumental Peaceful Lo-Fi Melody]
Enjoy the calm rhythm and warm gentle chords.
Perfect for prayer, reading scriptures, meditating, or focused work.`
  },
  {
    id: "yt-4",
    title: "Goodness of God",
    artist: "CeCe Winans",
    album: "Believe For It",
    duration: 298,
    category: "worship",
    sourceType: "youtube",
    youtubeId: "9sE5kEnitqE",
    coverUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=600&q=80",
    lyrics: `I love You, Lord
For Your mercy never fails me
All my days, I've been held in Your hands
From the moment that I wake up
Until I lay my head
Oh, I will sing of the goodness of God`
  },
  {
    id: "yt-5",
    title: "Acoustic Morning Grace",
    artist: "Heritage Strings",
    album: "Dawn Hymns",
    duration: 215,
    category: "acoustic",
    sourceType: "youtube",
    youtubeId: "1ZYbU82GVz4",
    coverUrl: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=600&q=80",
    lyrics: `[Gentle Acoustic Fingerpicking & Cello]
A tranquil acoustic hymn of blessing and renewal for the morning hours.`
  },
  {
    id: "yt-6",
    title: "Way Maker",
    artist: "Sinach / Leeland",
    album: "Better Word",
    duration: 320,
    category: "joy",
    sourceType: "youtube",
    youtubeId: "iJCV_2H9xD0",
    coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80",
    lyrics: `You are here, moving in our midst
I worship You, I worship You
You are here, working in this place
I worship You, I worship You

You are way maker, miracle worker, promise keeper
Light in the darkness, my God, that is who You are`
  }
];

export const CURATED_RECOMMENDATIONS = [
  {
    query: "Deep Morning Worship & Prayer",
    mood: "Devotional Peace",
    tracks: [
      {
        title: "The Blessing (Live)",
        artist: "Kari Jobe & Cody Carnes",
        youtubeId: "Zp6aygmvzM4",
        duration: "5:22",
        genre: "Contemporary Worship"
      },
      {
        title: "Graves Into Gardens",
        artist: "Elevation Worship ft. Brandon Lake",
        youtubeId: "KwX1f2g57_Y",
        duration: "5:45",
        genre: "Gospel & Praise"
      },
      {
        title: "Rest On Us",
        artist: "Maverick City Music & UPPERROOM",
        youtubeId: "2U_K-4cE0gA",
        duration: "6:14",
        genre: "Spirit & Atmosphere"
      }
    ]
  },
  {
    query: "Lo-Fi Instrumental & Calm Focus",
    mood: "Study & Contemplation",
    tracks: [
      {
        title: "Gentle Rain & Piano Hymns",
        artist: "Quiet Streams",
        youtubeId: "5qap5aO4i9A",
        duration: "3:40",
        genre: "Ambient Piano"
      },
      {
        title: "Coffee & Scripture Lo-Fi",
        artist: "Grace Beat Collective",
        youtubeId: "DWcJFNfaw9c",
        duration: "2:55",
        genre: "Lo-Fi Chill"
      }
    ]
  },
  {
    query: "High Energy Uplifting & Praise",
    mood: "Triumph & Energy",
    tracks: [
      {
        title: "House of the Lord",
        artist: "Phil Wickham",
        youtubeId: "x0vQyN3jQbg",
        duration: "4:15",
        genre: "Celebration Pop"
      },
      {
        title: "God Really Loves Us",
        artist: "Crowder ft. Dante Bowe",
        youtubeId: "mX4_jYx8bQ8",
        duration: "4:02",
        genre: "Southern Folk Praise"
      }
    ]
  }
];
