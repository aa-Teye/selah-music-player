import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useThemedStyles } from '../theme/ThemeContext';

export default function TopHeader({
  streakDays,
  searchQuery,
  onSearchChange,
  onOpenMenu
}) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.logoRow}>
          <Text style={styles.brandTitle}>Selah</Text>
        </View>

        <View style={styles.actionsRow}>
          {/* Hamburger Menu Drawer Button */}
          {onOpenMenu && (
            <TouchableOpacity onPress={onOpenMenu}
          testID="open-menu" style={styles.menuBtn} activeOpacity={0.7}>
              <Ionicons name="menu-outline" size={22} color={c.text} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Global Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color={c.textMuted} style={styles.searchIcon} />
        <TextInput
          placeholder="Search songs, scriptures, or YouTube..."
          placeholderTextColor={c.textSubtle}
          value={searchQuery}
          onChangeText={onSearchChange}
          style={styles.searchInput}
          returnKeyType="search"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => onSearchChange('')} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={16} color={c.textSubtle} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const makeStyles = (c) => StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: c.bg,
    borderBottomWidth: 1,
    borderBottomColor: c.border
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
    color: c.text,
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
    backgroundColor: c.surfaceAlt,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: c.border,
    paddingHorizontal: 12,
    height: 42
  },
  searchIcon: {
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    color: c.text,
    fontSize: 13,
    paddingVertical: 0
  },
  clearBtn: {
    padding: 4
  },
  menuBtn: {
    padding: 8,
    backgroundColor: c.surfaceAlt,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: c.border
  }
});
