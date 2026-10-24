import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function BottomTabs({ activeTab, onTabChange, onSelectTab }) {
  const tabs = [
    { id: 'home', label: 'Home', iconType: 'ion', icon: 'home-sharp' },
    { id: 'library', label: 'Library', iconType: 'ion', icon: 'musical-notes' },
    { id: 'youtube', label: 'YouTube', iconType: 'ion', icon: 'play-circle' },
    { id: 'playlists', label: 'Playlists', iconType: 'ion', icon: 'albums-outline' },
    { id: 'settings', label: 'EQ', iconType: 'ion', icon: 'options' }
  ];

  const handlePress = (tabId) => {
    if (onTabChange) onTabChange(tabId);
    if (onSelectTab) onSelectTab(tabId);
  };

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const color = isActive ? '#E5A93C' : '#9CA3AF';

        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tabButton}
            onPress={() => handlePress(tab.id)}
            activeOpacity={0.7}
          >
            {tab.iconType === 'ion' ? (
              <Ionicons name={tab.icon} size={22} color={color} />
            ) : (
              <MaterialCommunityIcons name={tab.icon} size={22} color={color} />
            )}
            <Text style={[styles.tabLabel, { color }]}>{tab.label}</Text>
            {isActive && <View style={styles.activeDot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 64,
    backgroundColor: '#111622',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 4
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: '100%',
    position: 'relative'
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2
  },
  activeDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5A93C'
  }
});
