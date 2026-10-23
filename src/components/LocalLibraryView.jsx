import React, { useRef } from 'react';
import { 
  UploadCloud, 
  Music, 
  Play, 
  Trash2, 
  Plus, 
  FolderMusic, 
  CheckCircle2, 
  Clock, 
  HardDrive 
} from './Icons';

export default function LocalLibraryView({
  localTracks,
  onAddLocalTracks,
  onPlayTrack,
  currentTrack,
  isPlaying,
  onDeleteLocalTrack,
  onAddToQueue
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newTracks = files.map((file, idx) => {
      const url = URL.createObjectURL(file);
      const cleanName = file.name.replace(/\.[^/.]+$/, "");
      return {
        id: `local-${Date.now()}-${idx}`,
        title: cleanName,
        artist: 'Local Audio',
        album: 'My Computer Library',
        duration: 180, // estimated until metadata loads
        category: 'local',
        sourceType: 'local',
        audioUrl: url,
        fileSize: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
        coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=300&q=80',
        lyrics: `[Local Audio Track: ${file.name}]\nPlaying from your local storage.`
      };
    });

    onAddLocalTracks(newTracks);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('audio/') || f.name.match(/\.(mp3|wav|ogg|m4a|flac)$/i));
      if (files.length === 0) return;

      const newTracks = files.map((file, idx) => {
        const url = URL.createObjectURL(file);
        const cleanName = file.name.replace(/\.[^/.]+$/, "");
        return {
          id: `local-${Date.now()}-${idx}`,
          title: cleanName,
          artist: 'Local Audio',
          album: 'My Computer Library',
          duration: 180,
          category: 'local',
          sourceType: 'local',
          audioUrl: url,
          fileSize: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
          coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=300&q=80',
          lyrics: `[Local Audio Track: ${file.name}]\nPlaying from your local computer storage.`
        };
      });

      onAddLocalTracks(newTracks);
    }
  };

  return (
    <div className="view-container local-library-view">
      <div className="view-header-row">
        <div>
          <h1 className="view-heading">Local Music Library</h1>
          <p className="view-subtitle">Play audio files directly from your Windows / Mac computer with zero lag</p>
        </div>

        <button 
          className="import-btn gold-glow"
          onClick={() => fileInputRef.current?.click()}
        >
          <Plus size={18} />
          <span>Import Songs</span>
        </button>
        <input 
          ref={fileInputRef}
          type="file" 
          multiple 
          accept="audio/*,.mp3,.wav,.ogg,.m4a,.flac" 
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>

      {/* Drag & Drop Upload Zone */}
      <div 
        className="upload-dropzone glass-panel"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="dropzone-icon-circle">
          <UploadCloud size={32} className="text-gold" />
        </div>
        <h3>Drag & Drop MP3, WAV, or FLAC files here</h3>
        <p>Or click anywhere to select songs from your local folders</p>
        <div className="dropzone-tags">
          <span className="file-badge">.MP3</span>
          <span className="file-badge">.WAV</span>
          <span className="file-badge">.FLAC</span>
          <span className="file-badge">.M4A</span>
        </div>
      </div>

      {/* Local Files Listing */}
      <div className="library-content-section">
        <div className="section-header-row">
          <div className="heading-with-icon">
            <HardDrive size={18} className="text-gold" />
            <h2 className="section-heading">Local Songs ({localTracks.length})</h2>
          </div>
        </div>

        {localTracks.length === 0 ? (
          <div className="empty-state glass-panel">
            <FolderMusic size={48} className="empty-icon" />
            <h3>No Local Songs Added Yet</h3>
            <p>Click "Import Songs" above to add your favorite MP3 and music tracks.</p>
          </div>
        ) : (
          <div className="local-tracks-table glass-panel">
            <div className="table-header">
              <span className="col-num">#</span>
              <span className="col-title">Title & Artist</span>
              <span className="col-album">Source</span>
              <span className="col-size">Size</span>
              <span className="col-actions">Actions</span>
            </div>

            <div className="table-body">
              {localTracks.map((track, idx) => {
                const isCurrent = currentTrack?.id === track.id;
                return (
                  <div 
                    key={track.id} 
                    className={`table-row ${isCurrent ? 'row-active' : ''}`}
                    onClick={() => onPlayTrack(track)}
                  >
                    <span className="col-num">
                      {isCurrent && isPlaying ? (
                        <span className="mini-wave-anim">♪</span>
                      ) : (
                        idx + 1
                      )}
                    </span>
                    
                    <div className="col-title track-meta-cell">
                      <div className="track-avatar-mini">
                        <Music size={16} />
                      </div>
                      <div className="track-names">
                        <strong className="track-name-bold">{track.title}</strong>
                        <span className="track-sub-artist">{track.artist}</span>
                      </div>
                    </div>

                    <span className="col-album text-muted">
                      Local Device
                    </span>

                    <span className="col-size text-muted">
                      {track.fileSize || 'Audio File'}
                    </span>

                    <div className="col-actions row-action-buttons" onClick={(e) => e.stopPropagation()}>
                      <button 
                        className="table-action-btn play-row-btn"
                        onClick={() => onPlayTrack(track)}
                        title="Play"
                      >
                        <Play size={16} fill="currentColor" />
                      </button>

                      <button 
                        className="table-action-btn delete-row-btn"
                        onClick={() => onDeleteLocalTrack(track.id)}
                        title="Remove from list"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
