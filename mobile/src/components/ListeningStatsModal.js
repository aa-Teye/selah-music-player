import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function ListeningStatsModal({
  visible,
  onClose,
  stats = { totalSeconds: 0, tracksPlayedCount: 0 },
  streakDays = 14,
  favoritesCount = 0
}) {
  const totalMinutes = Math.floor((stats?.totalSeconds || 0) / 60);
  const totalHours = (totalMinutes / 60).toFixed(1);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="stats-chart" size={22} color="#12141A" />
              <Text style={styles.title}>My Worship Journey</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#717886" />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Your spiritual listening analytics and daily devotion milestones
          </Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Main Stats Grid */}
            <View style={styles.grid}>
              {/* Daily Streak */}
              <View style={styles.statCard}>
                <View style={styles.cardIconRow}>
                  <Ionicons name="sparkles" size={22} color="#12141A" />
                  <Text style={styles.badge}>ACTIVE</Text>
                </View>
                <Text style={styles.statNumber}>{streakDays}</Text>
                <Text style={styles.statLabel}>Day Devotion Streak</Text>
              </View>

              {/* Total Worship Minutes */}
              <View style={styles.statCard}>
                <View style={styles.cardIconRow}>
                  <Ionicons name="time" size={22} color="#12141A" />
                  <Text style={styles.badge}>TIME</Text>
                </View>
                <Text style={styles.statNumber}>
                  {totalMinutes < 60 ? `${totalMinutes}m` : `${totalHours}h`}
                </Text>
                <Text style={styles.statLabel}>Total Time in Praise</Text>
              </View>

              {/* Songs Played */}
              <View style={styles.statCard}>
                <View style={styles.cardIconRow}>
                  <Ionicons name="musical-notes" size={22} color="#12141A" />
                  <Text style={styles.badge}>TRACKS</Text>
                </View>
                <Text style={styles.statNumber}>{stats?.tracksPlayedCount || 0}</Text>
                <Text style={styles.statLabel}>Songs Played</Text>
              </View>

              {/* Favorite Melodies */}
              <View style={styles.statCard}>
                <View style={styles.cardIconRow}>
                  <Ionicons name="heart" size={22} color="#12141A" />
                  <Text style={styles.badge}>FAVORITES</Text>
                </View>
                <Text style={styles.statNumber}>{favoritesCount}</Text>
                <Text style={styles.statLabel}>Saved in Heart</Text>
              </View>
            </View>

            {/* Motivational Scripture Card */}
            <View style={styles.scriptureCard}>
              <MaterialCommunityIcons name="book-open-page-variant" size={22} color="#12141A" />
              <Text style={styles.scriptureVerse}>
                "I will sing to the Lord as long as I live; I will sing praise to my God while I have being."
              </Text>
              <Text style={styles.scriptureRef}>— Psalm 104:33</Text>
            </View>

            {/* Encouragement Banner */}
            <View style={styles.encouragementBanner}>
              <Ionicons name="sunny" size={18} color="#12141A" />
              <Text style={styles.encouragementText}>
                Every melody lifted in faith strengthens the spirit and brings peace to your mind.
              </Text>
            </View>
          </ScrollView>

          {/* Close Action */}
          <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
            <Text style={styles.doneBtnText}>Close Analytics</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 17, 21, 0.45)',
    justifyContent: 'flex-end'
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '85%',
    borderTopWidth: 1,
    borderColor: '#E5E7EB'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F1115'
  },
  closeBtn: {
    padding: 6
  },
  subtitle: {
    color: '#717886',
    fontSize: 13,
    marginBottom: 20
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16
  },
  statCard: {
    width: '48%',
    backgroundColor: '#EEF0F4',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E6EC'
  },
  cardIconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  badge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#717886',
    backgroundColor: '#E2E6EC',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F1115',
    marginBottom: 4
  },
  statLabel: {
    fontSize: 12,
    color: '#717886',
    fontWeight: '600'
  },
  scriptureCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 14,
    gap: 8
  },
  scriptureVerse: {
    color: '#0F1115',
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 22
  },
  scriptureRef: {
    color: '#12141A',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'right'
  },
  encouragementBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#EEF0F4',
    padding: 14,
    borderRadius: 14,
    marginBottom: 20
  },
  encouragementText: {
    color: '#0F1115',
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
    fontWeight: '500'
  },
  doneBtn: {
    backgroundColor: '#12141A',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center'
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800'
  }
});
