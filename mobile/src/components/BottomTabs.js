import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function BottomTabs({ activeTab, onTabChange, onSelectTab }) {
  const tabs = [
    { id: 'home', label: 'Home', iconType: 'ion', icon: 'home-sharp' },
    { id: 'player', label: 'Player', iconType: 'ion', icon: 'disc-outline' },
    { id: 'library', label: 'Library', iconType: 'ion', icon: 'musical-notes' },
    { id: 'youtube', label: 'YouTube', iconType: 'ion', icon: 'play-circle' },
    { id: 'playlists', label: 'Playlists', iconType: 'ion', icon: 'albums-outline' }
  ];

  const handlePress = (tabId) => {
    if (onTabChange) onTabChange(tabId);
    if (onSelectTab) onSelectTab(tabId);
  };

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const color = isActive ? '#34D399' : '#757C8E';

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
            <Text style={[styles.tabLabel, { color, fontWeight: isActive ? '800' : '600' }]}>{tab.label}</Text>
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
    backgroundColor: '#101117',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
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
    marginTop: 2
  },
  activeDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#34D399',
    shadowColor: '#34D399',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3
  }
});
