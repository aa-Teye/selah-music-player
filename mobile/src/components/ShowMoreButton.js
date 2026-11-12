import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

/** "Show more" button for long song lists (drawing thousands of rows at once makes the app slow). */
export default function ShowMoreButton({ remaining = 0, onPress, label }) {
  if (!remaining || remaining <= 0) return null;
  return (
    <TouchableOpacity style={styles.btn} onPress={onPress} activeOpacity={0.8} testID="show-more">
      <Text style={styles.text}>{label || `Show more (${remaining} more)`}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    alignSelf: 'stretch',
    alignItems: 'center',
    backgroundColor: '#EEF0F4',
    borderRadius: 14,
    paddingVertical: 12,
    marginTop: 8,
    marginBottom: 16
  },
  text: { color: '#12141A', fontWeight: '800', fontSize: 14 }
});
