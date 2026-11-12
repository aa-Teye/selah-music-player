import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

function BottomTabs({ activeTab, onTabChange, onSelectTab }) {
  const tabs = [
    { id: 'home', label: 'Home', iconType: 'ion', icon: 'home-sharp' },
    { id: 'library', label: 'Library', iconType: 'ion', icon: 'musical-notes' },
    { id: 'youtube', label: 'YouTube', iconType: 'ion', icon: 'play-circle' },
    { id: 'player', label: 'Player', iconType: 'ion', icon: 'disc-outline' },
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
        const color = isActive ? '#12141A' : '#8A919E';

        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tabButton}
            onPress={() => handlePress(tab.id)}
            testID={`tab-${tab.id}`}
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
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
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
    backgroundColor: '#12141A',
    shadowColor: '#12141A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 2
  }
});

export default React.memo(BottomTabs);
