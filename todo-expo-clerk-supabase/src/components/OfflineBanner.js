// Displays offline network status warning
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function OfflineBanner() {
  return (
    <View style={styles.banner}>
      <Text style={styles.text}>⚠️ Offline — Changes will sync later</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#ffcc00',
    paddingVertical: 6,
    alignItems: 'center',
  },
  text: {
    color: '#000',
    fontWeight: '600',
  },
});
