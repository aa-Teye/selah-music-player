import React, { useState } from 'react';
import { 
  Sliders, 
  ShieldCheck, 
  Download, 
  Smartphone, 
  Monitor, 
  CheckCircle2, 
  X, 
  Volume2, 
  Sparkles,
  Info
} from 'lucide-react';

export default function EqualizerSettingsModal({ isOpen, onClose }) {
  const [eqPreset, setEqPreset] = useState('worship');
  const [bands, setBands] = useState({
    b60: 4,
    b230: 2,
    b910: 0,
    b3600: 3,
    b14000: 5
  });

  if (!isOpen) return null;

  const presets = [
    { id: 'flat', name: 'Flat', values: { b60: 0, b230: 0, b910: 0, b3600: 0, b14000: 0 } },
    { id: 'worship', name: 'Worship & Choral', values: { b60: 3, b230: 2, b910: 1, b3600: 4, b14000: 5 } },
    { id: 'bass', name: 'Bass Boost', values: { b60: 8, b230: 6, b910: 2, b3600: 0, b14000: 1 } },
    { id: 'acoustic', name: 'Acoustic Clarity', values: { b60: 2, b230: 4, b910: 3, b3600: 5, b14000: 6 } },
    { id: 'vocal', name: 'Vocal Enhance', values: { b60: -1, b230: 1, b910: 5, b3600: 6, b14000: 3 } }
  ];

  const handleSelectPreset = (preset) => {
    setEqPreset(preset.id);
    setBands(preset.values);
  };

  const handleBandChange = (key, val) => {
    setBands(prev => ({ ...prev, [key]: Number(val) }));
    setEqPreset('custom');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container glass-panel">
        <div className="modal-header">
          <div className="modal-title-wrap">
            <Sliders size={22} className="text-gold" />
            <h2>Audio Equalizer & App Settings</h2>
          </div>
          <button className="icon-circle-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body-scroll">
          {/* Equalizer Section */}
          <section className="eq-section">
            <h3 className="section-title">Sound Profile & 5-Band Equalizer</h3>
            <p className="section-desc">Fine-tune acoustic resonance, vocal clarity, and deep sub-bass frequencies.</p>

            <div className="preset-buttons-row">
              {presets.map(p => (
                <button
                  key={p.id}
                  className={`preset-btn ${eqPreset === p.id ? 'active-preset' : ''}`}
                  onClick={() => handleSelectPreset(p)}
                >
                  {p.name}
                </button>
              ))}
            </div>

            <div className="eq-sliders-grid">
              <div className="eq-band-col">
                <span className="eq-gain-val">{bands.b60 > 0 ? `+${bands.b60}` : bands.b60} dB</span>
                <input 
                  type="range" 
                  min="-10" 
                  max="10" 
                  value={bands.b60}
                  onChange={(e) => handleBandChange('b60', e.target.value)}
                  className="eq-slider-vertical" 
                />
                <span className="eq-freq-label">60 Hz</span>
                <small className="eq-sub-label">Sub-Bass</small>
              </div>

              <div className="eq-band-col">
                <span className="eq-gain-val">{bands.b230 > 0 ? `+${bands.b230}` : bands.b230} dB</span>
                <input 
                  type="range" 
                  min="-10" 
                  max="10" 
                  value={bands.b230}
                  onChange={(e) => handleBandChange('b230', e.target.value)}
                  className="eq-slider-vertical" 
                />
                <span className="eq-freq-label">230 Hz</span>
                <small className="eq-sub-label">Warmth</small>
              </div>

              <div className="eq-band-col">
                <span className="eq-gain-val">{bands.b910 > 0 ? `+${bands.b910}` : bands.b910} dB</span>
                <input 
                  type="range" 
                  min="-10" 
                  max="10" 
                  value={bands.b910}
                  onChange={(e) => handleBandChange('b910', e.target.value)}
                  className="eq-slider-vertical" 
                />
                <span className="eq-freq-label">910 Hz</span>
                <small className="eq-sub-label">Presence</small>
              </div>

              <div className="eq-band-col">
                <span className="eq-gain-val">{bands.b3600 > 0 ? `+${bands.b3600}` : bands.b3600} dB</span>
                <input 
                  type="range" 
                  min="-10" 
                  max="10" 
                  value={bands.b3600}
                  onChange={(e) => handleBandChange('b3600', e.target.value)}
                  className="eq-slider-vertical" 
                />
                <span className="eq-freq-label">3.6 kHz</span>
                <small className="eq-sub-label">Vocals</small>
              </div>

              <div className="eq-band-col">
                <span className="eq-gain-val">{bands.b14000 > 0 ? `+${bands.b14000}` : bands.b14000} dB</span>
                <input 
                  type="range" 
                  min="-10" 
                  max="10" 
                  value={bands.b14000}
                  onChange={(e) => handleBandChange('b14000', e.target.value)}
                  className="eq-slider-vertical" 
                />
                <span className="eq-freq-label">14 kHz</span>
                <small className="eq-sub-label">Air & Shimmer</small>
              </div>
            </div>
          </section>

          {/* Google Play Store Compliance Guidelines */}
          <section className="compliance-section glass-panel">
            <div className="section-header-row">
              <div className="heading-with-icon">
                <ShieldCheck size={20} className="text-emerald" />
                <h3 className="section-title">Google Play Store & YouTube API Policy Compliance</h3>
              </div>
            </div>

            <div className="compliance-points-list">
              <div className="compliance-item">
                <CheckCircle2 size={16} className="text-emerald" />
                <div>
                  <strong>Official YouTube IFrame Player API:</strong>
                  <p>All YouTube content is rendered via Google's official iframe player, respecting intellectual property and content creator views.</p>
                </div>
              </div>

              <div className="compliance-item">
                <CheckCircle2 size={16} className="text-emerald" />
                <div>
                  <strong>No Background Downloading or Ripping:</strong>
                  <p>In adherence to YouTube Terms of Service Section II.2, this player never extracts, caches, or downloads audio streams separately from video streams.</p>
                </div>
              </div>

              <div className="compliance-item">
                <CheckCircle2 size={16} className="text-emerald" />
                <div>
                  <strong>Local Audio Sandbox:</strong>
                  <p>Local files (.mp3, .wav) are processed strictly in client-side memory using the HTML5 Web Audio API with zero telemetry or privacy breaches.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Windows & Mobile Build Exporting */}
          <section className="export-section">
            <h3 className="section-title">Target Platform Export (Windows .EXE & Android .APK)</h3>
            <div className="export-cards-grid">
              <div className="export-card glass-panel">
                <Monitor size={28} className="text-gold" />
                <h4>Windows Desktop App</h4>
                <p>Runs as a standalone desktop executable on Windows 10 & 11 with keyboard shortcuts and hardware media keys.</p>
                <div className="cmd-snippet">
                  <code>npm run electron:build</code>
                </div>
              </div>

              <div className="export-card glass-panel">
                <Smartphone size={28} className="text-emerald" />
                <h4>Android APK (Play Store Ready)</h4>
                <p>Package via Capacitor to generate the release APK / Android App Bundle (AAB) compliant with Google Play Store policies.</p>
                <div className="cmd-snippet">
                  <code>npx cap build android</code>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="modal-footer">
          <button className="close-action-btn gold-glow" onClick={onClose}>
            Done & Apply
          </button>
        </div>
      </div>
    </div>
  );
}
