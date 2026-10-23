package com.muzioplayer.spirit.player

import android.app.Application
import android.content.ContentUris
import android.provider.MediaStore
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.muzioplayer.spirit.data.InitialData
import com.muzioplayer.spirit.model.DailyDevotion
import com.muzioplayer.spirit.model.SourceType
import com.muzioplayer.spirit.model.Track
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class PlayerUiState(
    val currentTrack: Track? = null,
    val isPlaying: Boolean = false,
    val currentPositionMs: Long = 0L,
    val durationMs: Long = 180000L,
    val isShuffle: Boolean = false,
    val isRepeat: Boolean = false,
    val queue: List<Track> = emptyList(),
    val localTracks: List<Track> = emptyList(),
    val allTracks: List<Track> = emptyList(),
    val favorites: Set<String> = setOf("yt-1", "yt-2"),
    val activeTab: String = "home",
    val isFullPlayerOpen: Boolean = false,
    val devotion: DailyDevotion = InitialData.devotion,
    val activeMood: String = "all",
    val searchQuery: String = ""
)

class PlayerViewModel(application: Application) : AndroidViewModel(application) {

    private val _uiState = MutableStateFlow(
        PlayerUiState(
            currentTrack = InitialData.tracks.firstOrNull(),
            queue = InitialData.tracks,
            allTracks = InitialData.tracks,
            durationMs = (InitialData.tracks.firstOrNull()?.durationSeconds ?: 180) * 1000L
        )
    )
    val uiState: StateFlow<PlayerUiState> = _uiState.asStateFlow()

    init {
        // Ticking timer for playback progress
        viewModelScope.launch {
            while (true) {
                delay(500)
                if (_uiState.value.isPlaying) {
                    val currentPos = _uiState.value.currentPositionMs + 500
                    val dur = _uiState.value.durationMs
                    if (currentPos >= dur && dur > 0) {
                        onTrackEnded()
                    } else {
                        _uiState.value = _uiState.value.copy(currentPositionMs = currentPos)
                    }
                }
            }
        }
    }

    fun playTrack(track: Track) {
        _uiState.value = _uiState.value.copy(
            currentTrack = track,
            isPlaying = true,
            currentPositionMs = 0L,
            durationMs = track.durationSeconds * 1000L
        )
    }

    fun togglePlay() {
        _uiState.value = _uiState.value.copy(
            isPlaying = !_uiState.value.isPlaying
        )
    }

    fun nextTrack() {
        val q = _uiState.value.queue
        if (q.isEmpty()) return

        if (_uiState.value.isShuffle) {
            val randomTrack = q.random()
            playTrack(randomTrack)
            return
        }

        val currentIndex = q.indexOfFirst { it.id == _uiState.value.currentTrack?.id }
        if (currentIndex != -1 && currentIndex < q.size - 1) {
            playTrack(q[currentIndex + 1])
        } else {
            playTrack(q.first())
        }
    }

    fun prevTrack() {
        if (_uiState.value.currentPositionMs > 4000L) {
            seekTo(0L)
            return
        }

        val q = _uiState.value.queue
        if (q.isEmpty()) return

        val currentIndex = q.indexOfFirst { it.id == _uiState.value.currentTrack?.id }
        if (currentIndex > 0) {
            playTrack(q[currentIndex - 1])
        } else {
            playTrack(q.last())
        }
    }

    fun seekTo(positionMs: Long) {
        _uiState.value = _uiState.value.copy(currentPositionMs = positionMs)
    }

    private fun onTrackEnded() {
        if (_uiState.value.isRepeat) {
            seekTo(0L)
            _uiState.value = _uiState.value.copy(isPlaying = true)
        } else {
            nextTrack()
        }
    }

    fun toggleShuffle() {
        _uiState.value = _uiState.value.copy(isShuffle = !_uiState.value.isShuffle)
    }

    fun toggleRepeat() {
        _uiState.value = _uiState.value.copy(isRepeat = !_uiState.value.isRepeat)
    }

    fun toggleFavorite(trackId: String) {
        val currentFavs = _uiState.value.favorites.toMutableSet()
        if (currentFavs.contains(trackId)) {
            currentFavs.remove(trackId)
        } else {
            currentFavs.add(trackId)
        }
        _uiState.value = _uiState.value.copy(favorites = currentFavs)
    }

    fun setActiveTab(tab: String) {
        _uiState.value = _uiState.value.copy(activeTab = tab)
    }

    fun setFullPlayerOpen(isOpen: Boolean) {
        _uiState.value = _uiState.value.copy(isFullPlayerOpen = isOpen)
    }

    fun setActiveMood(mood: String) {
        _uiState.value = _uiState.value.copy(activeMood = mood)
    }

    fun setSearchQuery(query: String) {
        _uiState.value = _uiState.value.copy(searchQuery = query)
    }

    // Scans the Android device's MediaStore for local MP3/WAV/FLAC audio files
    fun scanDeviceAudioFiles() {
        viewModelScope.launch(Dispatchers.IO) {
            val context = getApplication<Application>()
            val audioList = mutableListOf<Track>()

            val projection = arrayOf(
                MediaStore.Audio.Media._ID,
                MediaStore.Audio.Media.TITLE,
                MediaStore.Audio.Media.ARTIST,
                MediaStore.Audio.Media.DURATION,
                MediaStore.Audio.Media.ALBUM
            )

            val selection = "${MediaStore.Audio.Media.IS_MUSIC} != 0"
            val sortOrder = "${MediaStore.Audio.Media.TITLE} ASC"

            try {
                val cursor = context.contentResolver.query(
                    MediaStore.Audio.Media.EXTERNAL_CONTENT_URI,
                    projection,
                    selection,
                    null,
                    sortOrder
                )

                cursor?.use {
                    val idCol = it.getColumnIndexOrThrow(MediaStore.Audio.Media._ID)
                    val titleCol = it.getColumnIndexOrThrow(MediaStore.Audio.Media.TITLE)
                    val artistCol = it.getColumnIndexOrThrow(MediaStore.Audio.Media.ARTIST)
                    val durationCol = it.getColumnIndexOrThrow(MediaStore.Audio.Media.DURATION)
                    val albumCol = it.getColumnIndexOrThrow(MediaStore.Audio.Media.ALBUM)

                    while (it.moveToNext()) {
                        val id = it.getLong(idCol)
                        val title = it.getString(titleCol) ?: "Unknown Track"
                        val artist = it.getString(artistCol) ?: "Local Artist"
                        val durationMs = it.getLong(durationCol)
                        val album = it.getString(albumCol) ?: "Local Device"

                        val contentUri = ContentUris.withAppendedId(
                            MediaStore.Audio.Media.EXTERNAL_CONTENT_URI,
                            id
                        ).toString()

                        audioList.add(
                            Track(
                                id = "local_$id",
                                title = title,
                                artist = artist,
                                album = album,
                                durationSeconds = (durationMs / 1000).coerceAtLeast(1),
                                sourceType = SourceType.LOCAL_DEVICE,
                                contentUri = contentUri,
                                coverUrl = "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=300&q=80"
                            )
                        )
                    }
                }

                if (audioList.isNotEmpty()) {
                    _uiState.value = _uiState.value.copy(
                        localTracks = audioList,
                        allTracks = audioList + _uiState.value.allTracks
                    )
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }
}
