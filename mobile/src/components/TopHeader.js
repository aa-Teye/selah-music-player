import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function TopHeader({
  streakDays,
  searchQuery,
  onSearchChange,
  onOpenAi,
  onOpenMenu
}) {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.logoRow}>
          <Text style={styles.brandTitle}>SELAH </Text>
          <Text style={styles.goldText}>PLAYER</Text>
        </View>

        <View style={styles.actionsRow}>
          {/* YouVersion Streak Flame */}
          <View style={styles.streakBadge}>
            <Ionicons name="flame" size={18} color="#F97316" />
            <Text style={styles.streakText}>{streakDays}</Text>
            <Text style={styles.streakLabel}>DAYS</Text>
          </View>

          {/* Hamburger Menu Drawer Button */}
          {onOpenMenu && (
            <TouchableOpacity onPress={onOpenMenu} style={styles.menuBtn} activeOpacity={0.7}>
              <Ionicons name="menu" size={24} color="#F3F4F6" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Global Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          placeholder="Search songs, scriptures, or YouTube..."
          placeholderTextColor="#6B7280"
          value={searchQuery}
          onChangeText={onSearchChange}
          style={styles.searchInput}
          returnKeyType="search"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => onSearchChange('')} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#080A0F',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)'
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FBFBFC',
    letterSpacing: 0.8
  },
  goldText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#E5A93C',
    letterSpacing: 0.8,
    marginLeft: 4
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(229, 169, 60, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(229, 169, 60, 0.28)',
    gap: 4
  },
  streakText: {
    color: '#F5B74F',
    fontWeight: '800',
    fontSize: 13
  },
  streakLabel: {
    color: '#A0A6B5',
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 0.5
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(229, 169, 60, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(229, 169, 60, 0.3)',
    gap: 4
  },
  aiButtonText: {
    color: '#E5A93C',
    fontWeight: '800',
    fontSize: 12
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#151B28',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    height: 42
  },
  searchIcon: {
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    color: '#FBFBFC',
    fontSize: 13,
    paddingVertical: 0
  },
  clearBtn: {
    padding: 4
  },
  menuBtn: {
    padding: 6,
    marginLeft: 4,
    backgroundColor: '#151B28',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)'
  }
});
