import React from 'react';
import { X, Play, Trash2, Music, Youtube, Sparkles } from './Icons';

export default function QueueDrawer({
  isOpen,
  onClose,
  queue,
  currentTrack,
  onPlayTrack,
  onRemoveFromQueue,
  onClearQueue
}) {
  if (!isOpen) return null;

  return (
    <div className="queue-drawer-overlay" onClick={onClose}>
      <div className="queue-drawer glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="queue-drawer-header">
          <div className="queue-header-title">
            <h3>Playback Queue</h3>
            <span className="queue-count-pill">{queue.length} Tracks</span>
          </div>

          <div className="queue-header-actions">
            {queue.length > 0 && (
              <button className="clear-queue-btn" onClick={onClearQueue} title="Clear queue">
                Clear
              </button>
            )}
            <button className="icon-circle-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="queue-drawer-list">
          {queue.length === 0 ? (
            <div className="queue-empty">
              <Music size={40} className="text-muted" />
              <p>Your queue is currently empty.</p>
              <small>Add songs from the Home feed, YouTube watch, or AI recommendations.</small>
            </div>
          ) : (
            queue.map((track, idx) => {
              const isCurrent = currentTrack?.id === track.id;
              return (
                <div 
                  key={track.id || idx}
                  className={`queue-track-item ${isCurrent ? 'active-track' : ''}`}
                  onClick={() => onPlayTrack(track)}
                >
                  <span className="track-order-index">{idx + 1}</span>
                  <img src={track.coverUrl} alt={track.title} className="queue-track-thumb" />
                  
                  <div className="queue-track-info">
                    <span className="queue-track-title">{track.title}</span>
                    <span className="queue-track-artist">{track.artist}</span>
                  </div>

                  <div className="queue-track-actions" onClick={(e) => e.stopPropagation()}>
                    <button 
                      className="queue-remove-btn"
                      onClick={() => onRemoveFromQueue(idx)}
                      title="Remove from queue"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
