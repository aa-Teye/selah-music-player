import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function TopHeader({
  streakDays,
  searchQuery,
  onSearchChange,
  onOpenMenu
}) {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.logoRow}>
          <Text style={styles.brandTitle}>Selah</Text>
        </View>

        <View style={styles.actionsRow}>
          {/* Hamburger Menu Drawer Button */}
          {onOpenMenu && (
            <TouchableOpacity onPress={onOpenMenu} style={styles.menuBtn} activeOpacity={0.7}>
              <Ionicons name="menu-outline" size={22} color="#0F1115" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Global Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color="#717886" style={styles.searchIcon} />
        <TextInput
          placeholder="Search songs, scriptures, or YouTube..."
          placeholderTextColor="#8A919E"
          value={searchQuery}
          onChangeText={onSearchChange}
          style={styles.searchInput}
          returnKeyType="search"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => onSearchChange('')} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={16} color="#8A919E" />
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
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
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
    fontSize: 24,
    fontWeight: '800',
    color: '#0F1115',
    letterSpacing: 0.5
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF0F4',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2E6EC',
    paddingHorizontal: 12,
    height: 42
  },
  searchIcon: {
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    color: '#0F1115',
    fontSize: 13,
    paddingVertical: 0
  },
  clearBtn: {
    padding: 4
  },
  menuBtn: {
    padding: 8,
    backgroundColor: '#EEF0F4',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E6EC'
  }
});
