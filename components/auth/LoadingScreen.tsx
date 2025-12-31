import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import Theme from '../../lib/theme';

export default function LoadingScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Theme.colors.brand.primary} />
      <Text style={styles.text}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.background.primary,
  },
  text: {
    marginTop: Theme.spacing.md,
    fontSize: Theme.fontSize.base,
    color: Theme.colors.text.secondary,
  },
});
