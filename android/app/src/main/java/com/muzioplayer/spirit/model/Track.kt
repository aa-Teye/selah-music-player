package com.muzioplayer.spirit.model

data class Track(
    val id: String,
    val title: String,
    val artist: String,
    val album: String = "",
    val durationSeconds: Long = 180,
    val coverUrl: String = "",
    val sourceType: SourceType = SourceType.YOUTUBE,
    val youtubeId: String = "",
    val contentUri: String = "",
    val category: String = "worship",
    val lyrics: String = ""
)

enum class SourceType {
    YOUTUBE,
    LOCAL_DEVICE,
    AI_RECOMMENDED
}
