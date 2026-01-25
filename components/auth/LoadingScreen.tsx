import React from 'react';
import { View, StyleSheet, ActivityIndicator, Image, Text } from 'react-native';
import Theme from '../../lib/theme';

export default function LoadingScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* App Logo */}
        <Image 
          source={require('../../assets/images/icon.png')} 
          style={styles.logo}
          resizeMode="contain"
        />

        {/* App Name */}
        <Text style={styles.appName}>
          HABIT<Text style={styles.appNameX}>X</Text>
        </Text>

        {/* Loading Indicator */}
        <ActivityIndicator 
          size="small" 
          color="#DC2626" 
          style={styles.loader}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
  },
  content: {
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: Theme.spacing.lg,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 4,
    marginBottom: Theme.spacing.xl,
  },
  appNameX: {
    color: '#DC2626',
  },
  loader: {
    marginTop: Theme.spacing.sm,
  },
});
