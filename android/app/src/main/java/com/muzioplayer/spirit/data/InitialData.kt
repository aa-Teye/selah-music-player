package com.muzioplayer.spirit.data

import com.muzioplayer.spirit.model.DailyDevotion
import com.muzioplayer.spirit.model.SourceType
import com.muzioplayer.spirit.model.Track

object InitialData {
    val devotion = DailyDevotion(
        streakDays = 14,
        verse = "“The Lord is my strength and my shield; in him my heart trusts, and I am helped; my heart exults, and with my song I give thanks to him.”",
        reference = "Psalm 28:7 (ESV)",
        reflection = "Music is a vessel of thanksgiving. Whatever storm you are walking through today, let melody re-anchor your spirit in peace."
    )

    val tracks = listOf(
        Track(
            id = "yt-1",
            title = "Gratitude (Live)",
            artist = "Brandon Lake",
            album = "House of Miracles",
            durationSeconds = 338,
            category = "worship",
            sourceType = SourceType.YOUTUBE,
            youtubeId = "dQ3Cj8-7M3Y",
            coverUrl = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80",
            lyrics = "All my words fall short\nI got nothing new\nHow could I express\nAll my gratitude?\n\nSo I throw up my hands\nAnd praise You again and again\n'Cause all that I have is a hallelujah"
        ),
        Track(
            id = "yt-2",
            title = "Oceans (Where Feet May Fail)",
            artist = "Hillsong UNITED",
            album = "ZION",
            durationSeconds = 536,
            category = "peace",
            sourceType = SourceType.YOUTUBE,
            youtubeId = "6XX7d_jX6Z8",
            coverUrl = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
            lyrics = "You call me out upon the waters\nThe great unknown where feet may fail\nAnd there I find You in the mystery\nIn oceans deep, my faith will stand"
        ),
        Track(
            id = "yt-3",
            title = "Lo-Fi Worship & Study Beats",
            artist = "Sunday Chill Sessions",
            album = "Peaceful Mind Vol. 1",
            durationSeconds = 245,
            category = "lofi",
            sourceType = SourceType.YOUTUBE,
            youtubeId = "jfKfPfyJRdk",
            coverUrl = "https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=600&q=80",
            lyrics = "[Peaceful Ambient Lo-Fi Instrumental for study, scripture, and rest]"
        ),
        Track(
            id = "yt-4",
            title = "Goodness of God",
            artist = "CeCe Winans",
            album = "Believe For It",
            durationSeconds = 298,
            category = "worship",
            sourceType = SourceType.YOUTUBE,
            youtubeId = "9sE5kEnitqE",
            coverUrl = "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=600&q=80",
            lyrics = "I love You, Lord\nFor Your mercy never fails me\nAll my days, I've been held in Your hands\nOh, I will sing of the goodness of God"
        ),
        Track(
            id = "yt-5",
            title = "House of the Lord",
            artist = "Phil Wickham",
            album = "Hymn of Heaven",
            durationSeconds = 255,
            category = "joy",
            sourceType = SourceType.YOUTUBE,
            youtubeId = "x0vQyN3jQbg",
            coverUrl = "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80",
            lyrics = "We sing to the God who heals\nWe sing to the God who saves\nWe sing to the God who always makes a way"
        )
    )
}
