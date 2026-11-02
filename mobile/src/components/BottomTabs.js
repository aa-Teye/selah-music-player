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
        const color = isActive ? '#F5B74F' : '#7E8799';

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
    backgroundColor: '#0B0E16',
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
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#F5B74F',
    shadowColor: '#E5A93C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 5,
    elevation: 4
  }
});
