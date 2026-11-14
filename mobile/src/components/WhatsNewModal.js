import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useThemedStyles } from '../theme/ThemeContext';

/** "What's new in Selah": shown once after an update, and any time from the menu */
export default function WhatsNewModal({ news, onClose }) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  if (!news) return null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card} testID="whats-new">
          <View style={styles.badge}>
            <Ionicons name="megaphone-outline" size={22} color="#FFFFFF" />
          </View>
          <Text style={styles.title}>{news.title}</Text>
          {news.items.map((item) => (
            <View key={item.text} style={styles.row}>
              <Ionicons name={item.icon} size={18} color={c.ink} />
              <Text style={styles.rowText}>{item.text}</Text>
            </View>
          ))}
          <TouchableOpacity style={styles.button} onPress={onClose} testID="whats-new-close">
            <Text style={styles.buttonText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(8, 9, 12, 0.6)', justifyContent: 'center', padding: 24 },
    card: { backgroundColor: c.surface, borderRadius: 22, padding: 22, gap: 12, borderWidth: 1, borderColor: c.border },
    badge: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.inverse,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center'
    },
    title: { color: c.text, fontSize: 20, fontWeight: '900', textAlign: 'center', marginBottom: 4 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    rowText: { color: c.text, fontSize: 14, lineHeight: 20, flex: 1 },
    button: { backgroundColor: c.inverse, borderRadius: 14, paddingVertical: 13, alignItems: 'center', marginTop: 8 },
    buttonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 }
  });
