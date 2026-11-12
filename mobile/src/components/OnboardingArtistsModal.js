import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors, useThemedStyles } from '../theme/ThemeContext';

const { width } = Dimensions.get('window');

const ARTISTS = [
  { id: 'maverick', name: 'Maverick City Music', genre: 'Contemporary Worship' },
  { id: 'brandon', name: 'Brandon Lake', genre: 'Praise & Acoustic' },
  { id: 'cece', name: 'CeCe Winans', genre: 'Traditional & Gospel' },
  { id: 'sinach', name: 'Sinach', genre: 'Anthem Praise' },
  { id: 'hillsong', name: 'Hillsong Worship', genre: 'Atmospheric Worship' },
  { id: 'chandler', name: 'Chandler Moore', genre: 'Soulful Worship' },
  { id: 'nathaniel', name: 'Nathaniel Bassey', genre: 'Spiritual & Trumpet' },
  { id: 'elevation', name: 'Elevation Worship', genre: 'Stadium Worship' },
  { id: 'dunsin', name: 'Dunsin Oyekan', genre: 'Prophetic Praise' },
  { id: 'moses', name: 'Moses Bliss', genre: 'Afro-Gospel Joy' },
  { id: 'lauren', name: 'Lauren Daigle', genre: 'Soulful Christian' },
  { id: 'tasha', name: 'Tasha Cobbs Leonard', genre: 'Gospel Power' },
  { id: 'phil', name: 'Phil Wickham', genre: 'Modern Hymns' },
  { id: 'bethel', name: 'Bethel Music', genre: 'Peaceful Presence' }
];

const VIBES = [
  { id: 'worship', label: 'Deep Worship', icon: 'heart' },
  { id: 'peace', label: 'Morning Peace', icon: 'leaf' },
  { id: 'praise', label: 'Joyful Praise', icon: 'sunny' },
  { id: 'acoustic', label: 'Acoustic Guitar', icon: 'musical-notes' },
  { id: 'prayer', label: 'Prayer & Stillness', icon: 'book' },
  { id: 'study', label: 'Focus & Study', icon: 'headset' }
];

export default function OnboardingArtistsModal({
  visible,
  onClose,
  onFinish,
  onComplete
}) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const [localDismissed, setLocalDismissed] = useState(false);
  const [selectedArtists, setSelectedArtists] = useState(['maverick', 'brandon', 'cece']);
  const [selectedVibe, setSelectedVibe] = useState('worship');

  const toggleArtist = (id) => {
    setSelectedArtists((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const handleFinish = () => {
    setLocalDismissed(true);
    const chosen = ARTISTS.filter((a) => selectedArtists.includes(a.id)).map((a) => a.name);
    const finalArtists = chosen.length > 0 ? chosen : ['Brandon Lake', 'CeCe Winans', 'Maverick City Music'];

    try {
      if (onFinish) {
        onFinish(finalArtists);
      }
      if (onComplete) {
        onComplete({
          artists: finalArtists,
          vibe: selectedVibe
        });
      }
      if (onClose) {
        onClose();
      }
    } catch (err) {
      console.log('Error completing onboarding:', err);
    }
  };

  if (!visible || localDismissed) return null;

  return (
    <Modal visible={visible && !localDismissed} animationType="slide" transparent onRequestClose={handleFinish}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Top Brand Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 8 }}>
              <View style={styles.logoBadge}>
                <MaterialCommunityIcons name="music-clef-treble" size={26} color="#FFFFFF" />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TouchableOpacity 
                  style={styles.headerDoneBtn}
                  onPress={handleFinish}
                  activeOpacity={0.8}
                >
                  <Text style={styles.headerDoneText}>Done</Text>
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={handleFinish}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons name="close-circle" size={26} color={c.textMuted} />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.title}>Welcome to Selah</Text>
            <Text style={styles.subtitle}>
              Personalize your daily atmosphere. Select your favorite worship leaders and spiritual vibes.
            </Text>
          </View>

          <ScrollView 
            style={styles.scroll} 
            contentContainerStyle={{ paddingBottom: 16 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Preferred Atmosphere Vibe */}
            <Text style={styles.sectionHeading}>1. SELECT YOUR DAILY ATMOSPHERE</Text>
            <View style={styles.vibesGrid}>
              {VIBES.map((v) => {
                const isActive = selectedVibe === v.id;
                return (
                  <TouchableOpacity
                    key={v.id}
                    style={[styles.vibePill, isActive && styles.vibePillActive]}
                    onPress={() => setSelectedVibe(v.id)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={v.icon}
                      size={15}
                      color={isActive ? '#FFFFFF' : c.textMuted}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={[styles.vibeText, isActive && styles.vibeTextActive]}>
                      {v.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Favorite Artists Selector */}
            <Text style={[styles.sectionHeading, { marginTop: 20 }]}>
              2. CHOOSE YOUR FAVORITE MINISTRIES & ARTISTS
            </Text>
            <Text style={styles.sectionHint}>
              These will appear on your Home Screen as custom recommendations.
            </Text>

            <View style={styles.artistsGrid}>
              {ARTISTS.map((artist) => {
                const isSelected = selectedArtists.includes(artist.id);
                return (
                  <TouchableOpacity
                    key={artist.id}
                    style={[styles.artistCard, isSelected && styles.artistCardSelected]}
                    onPress={() => toggleArtist(artist.id)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.artistAvatar, isSelected && styles.artistAvatarSelected]}>
                      <Ionicons
                        name="person"
                        size={18}
                        color={isSelected ? '#FFFFFF' : c.textMuted}
                      />
                    </View>
                    <View style={styles.artistInfo}>
                      <Text style={[styles.artistName, isSelected && styles.artistNameSelected]}>
                        {artist.name}
                      </Text>
                      <Text style={styles.artistGenre}>{artist.genre}</Text>
                    </View>
                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                      {isSelected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Action Button */}
          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.submitBtn} 
              onPress={handleFinish} 
              activeOpacity={0.8}
            >
              <Text style={styles.submitBtnText}>
                Start Listening ({selectedArtists.length} Selected)
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (c) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 17, 21, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  card: {
    width: '100%',
    height: '88%',
    maxHeight: 720,
    backgroundColor: c.surface,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: c.border,
    padding: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 25,
    elevation: 8,
    justifyContent: 'space-between'
  },
  header: {
    alignItems: 'center',
    marginBottom: 8
  },
  headerDoneBtn: {
    backgroundColor: c.inverse,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4
  },
  headerDoneText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800'
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: c.inverse,
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: c.text,
    letterSpacing: 0.5,
    marginBottom: 4,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 12,
    color: c.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 10
  },
  scroll: {
    flex: 1,
    marginVertical: 6
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: c.text,
    letterSpacing: 1,
    marginBottom: 10
  },
  sectionHint: {
    fontSize: 12,
    color: c.textMuted,
    marginBottom: 12
  },
  vibesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  vibePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: c.border
  },
  vibePillActive: {
    backgroundColor: c.inverse,
    borderColor: c.inverse
  },
  vibeText: {
    fontSize: 12,
    color: c.textMuted,
    fontWeight: '600'
  },
  vibeTextActive: {
    color: '#FFFFFF',
    fontWeight: '800'
  },
  artistsGrid: {
    gap: 8
  },
  artistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.surface,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.border
  },
  artistCardSelected: {
    borderColor: c.inverse,
    backgroundColor: c.surfaceAlt
  },
  artistAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: c.surfaceAlt,
    borderWidth: 1,
    borderColor: c.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  artistAvatarSelected: {
    backgroundColor: c.inverse,
    borderColor: c.inverse
  },
  artistInfo: {
    flex: 1
  },
  artistName: {
    fontSize: 14,
    fontWeight: '700',
    color: c.text
  },
  artistNameSelected: {
    color: c.text
  },
  artistGenre: {
    fontSize: 11,
    color: c.textMuted,
    marginTop: 2
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: c.border,
    justifyContent: 'center',
    alignItems: 'center'
  },
  checkboxSelected: {
    backgroundColor: c.inverse,
    borderColor: c.inverse
  },
  footer: {
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: c.border
  },
  submitBtn: {
    backgroundColor: c.inverse,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3
  }
});
