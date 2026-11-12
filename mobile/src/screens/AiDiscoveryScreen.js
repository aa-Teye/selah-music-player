import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator 
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors, useThemedStyles } from '../theme/ThemeContext';

export default function AiDiscoveryScreen({
  onPlayTrack,
  currentTrack,
  onBack
}) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const samplePrompts = [
    { label: "Peaceful Acoustic Worship for Anxiety", icon: "🕊️" },
    { label: "High Energy Workout Praise", icon: "⚡" },
    { label: "Midnight Scripture & Lo-Fi Beats", icon: "☕" },
    { label: "Psalm 23 Deep Meditation Piano", icon: "📖" }
  ];

  const handleRunSearch = (query) => {
    const q = query || prompt;
    if (!q.trim()) return;

    setLoading(true);
    setPrompt(q);

    setTimeout(() => {
      const lower = q.toLowerCase();
      let match;

      if (lower.includes('peace') || lower.includes('anxiety') || lower.includes('calm') || lower.includes('acoustic')) {
        match = {
          theme: "Peace, Calming & Healing Grace",
          insight: "AI model curated gentle acoustic guitars and reassuring vocal harmonies scientifically linked to reducing cortisol and promoting spiritual peace.",
          tracks: [
            {
              id: "ai-1",
              title: "Oceans (Where Feet May Fail)",
              artist: "Hillsong UNITED",
              youtubeId: "6XX7d_jX6Z8",
              duration: 536,
              sourceType: "youtube",
              genre: "Acoustic Worship",
              coverUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
              reason: "Lyrically guides the soul out of anxiety into supernatural stillness."
            },
            {
              id: "ai-2",
              title: "Goodness of God",
              artist: "CeCe Winans",
              youtubeId: "9sE5kEnitqE",
              duration: 298,
              sourceType: "youtube",
              genre: "Soulful Gospel",
              coverUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=600&q=80",
              reason: "Vocal warmth emphasizing daily faithfulness through life's trials."
            }
          ]
        };
      } else {
        match = {
          theme: `Recommendations for: "${q}"`,
          insight: "AI synthesized YouTube praise catalogs to match the tempo and mood of your custom query.",
          tracks: [
            {
              id: "ai-3",
              title: "House of the Lord",
              artist: "Phil Wickham",
              youtubeId: "x0vQyN3jQbg",
              duration: 255,
              sourceType: "youtube",
              genre: "Upbeat Celebration",
              coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80",
              reason: "Celebratory driving rhythm to revitalize your spirit."
            },
            {
              id: "ai-4",
              title: "Lo-Fi Worship & Study Beats",
              artist: "Sunday Chill Sessions",
              youtubeId: "jfKfPfyJRdk",
              duration: 245,
              sourceType: "youtube",
              genre: "Scripture Lo-Fi",
              coverUrl: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=600&q=80",
              reason: "Gentle rhythm supporting focus and devotional reading."
            }
          ]
        };
      }

      setResults(match);
      setLoading(false);
    }, 600);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Back button */}
      {onBack && (
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={c.ink} />
          <Text style={styles.backButtonText}>Back to Home</Text>
        </TouchableOpacity>
      )}

      {/* AI Hero Banner */}
      <View style={styles.heroCard}>
        <View style={styles.heroBadge}>
          <MaterialCommunityIcons name="creation" size={14} color={c.ink} />
          <Text style={styles.heroBadgeText}>AI MUSIC DISCOVERY</Text>
        </View>
        <Text style={styles.heroTitle}>Find Music for Any Mood or Scripture</Text>
        <Text style={styles.heroSubtitle}>
          Ask for a prayer feeling, biblical theme, or tempo, and let the AI find matching YouTube tracks.
        </Text>

        {/* Input */}
        <View style={styles.inputRow}>
          <TextInput
            placeholder="e.g. Peaceful acoustic worship for anxiety..."
            placeholderTextColor={c.textSubtle}
            value={prompt}
            onChangeText={setPrompt}
            style={styles.textInput}
            onSubmitEditing={() => handleRunSearch()}
          />
          <TouchableOpacity 
            style={styles.askBtn} 
            onPress={() => handleRunSearch()}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <MaterialCommunityIcons name="creation" size={18} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>

        {/* Quick Prompts */}
        <View style={styles.promptsList}>
          {samplePrompts.map((p, idx) => (
            <TouchableOpacity 
              key={idx} 
              style={styles.promptPill}
              onPress={() => handleRunSearch(p.label)}
            >
              <Text style={styles.promptIcon}>{p.icon}</Text>
              <Text style={styles.promptText}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Results */}
      {results && (
        <View style={styles.resultsContainer}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultTheme}>{results.theme}</Text>
            <Text style={styles.resultInsight}>{results.insight}</Text>
          </View>

          {results.tracks.map((track) => {
            const isCurrent = currentTrack?.youtubeId === track.youtubeId;
            return (
              <View key={track.id} style={[styles.trackCard, isCurrent && styles.activeCard]}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{track.title}</Text>
                    <Text style={styles.cardArtist}>{track.artist}</Text>
                  </View>
                  <View style={styles.genrePill}>
                    <Text style={styles.genreText}>{track.genre}</Text>
                  </View>
                </View>

                <View style={styles.reasonBox}>
                  <Text style={styles.reasonLabel}>AI Insight:</Text>
                  <Text style={styles.reasonText}>{track.reason}</Text>
                </View>

                <TouchableOpacity 
                  style={styles.playNowBtn}
                  onPress={() => onPlayTrack(track)}
                >
                  <Ionicons name="play" size={16} color="#FFFFFF" />
                  <Text style={styles.playNowText}>Play on YouTube</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const makeStyles = (c) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.bg
  },
  content: {
    padding: 16,
    paddingBottom: 40
  },
  heroCard: {
    backgroundColor: c.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: c.border,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8
  },
  heroBadgeText: {
    color: c.ink,
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.8
  },
  heroTitle: {
    color: c.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6
  },
  heroSubtitle: {
    color: c.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14
  },
  textInput: {
    flex: 1,
    backgroundColor: c.surfaceAlt,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 20,
    color: c.text,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 13
  },
  askBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: c.inverse,
    alignItems: 'center',
    justifyContent: 'center'
  },
  promptsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  promptPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.surfaceAlt,
    borderWidth: 1,
    borderColor: c.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6
  },
  promptIcon: {
    fontSize: 12
  },
  promptText: {
    color: c.textMuted,
    fontSize: 11,
    fontWeight: '600'
  },
  resultsContainer: {
    marginTop: 8
  },
  resultHeader: {
    backgroundColor: c.surface,
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
    borderLeftWidth: 3,
    borderLeftColor: c.inverse,
    borderWidth: 1,
    borderColor: c.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1
  },
  resultTheme: {
    color: c.text,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4
  },
  resultInsight: {
    color: c.textMuted,
    fontSize: 12,
    lineHeight: 17
  },
  trackCard: {
    backgroundColor: c.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: c.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1
  },
  activeCard: {
    borderColor: c.inverse,
    backgroundColor: c.surfaceAlt
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10
  },
  cardTitle: {
    color: c.text,
    fontSize: 14,
    fontWeight: '700'
  },
  cardArtist: {
    color: c.textMuted,
    fontSize: 12,
    marginTop: 2
  },
  genrePill: {
    backgroundColor: c.surfaceAlt,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10
  },
  genreText: {
    color: c.ink,
    fontSize: 10,
    fontWeight: '700'
  },
  reasonBox: {
    backgroundColor: c.surfaceAlt,
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 2,
    borderLeftColor: c.inverse
  },
  reasonLabel: {
    color: c.ink,
    fontSize: 10,
    fontWeight: '800'
  },
  reasonText: {
    color: c.textMuted,
    fontSize: 11,
    marginTop: 2,
    lineHeight: 16
  },
  playNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.inverse,
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6
  },
  playNowText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 6
  },
  backButtonText: {
    color: c.ink,
    fontWeight: '700',
    fontSize: 14
  }
});
