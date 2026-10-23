package com.muzioplayer.spirit.model

data class DailyDevotion(
    val title: String = "Verse of the Day",
    val streakDays: Int = 14,
    val verse: String,
    val reference: String,
    val reflection: String,
    val featuredTrackId: String = "yt-1"
)
