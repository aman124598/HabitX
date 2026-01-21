import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '../Themed';
import Theme from '../../lib/theme';

interface UserAvatarProps {
  username?: string;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

export function UserAvatar({ 
  username = '', 
  size = 'medium', 
  style,
}: UserAvatarProps) {
  const sizeConfig = {
    small: { avatar: 40, icon: 20, text: 'sm' as const },
    medium: { avatar: 50, icon: 24, text: 'base' as const },
    large: { avatar: 80, icon: 40, text: 'lg' as const },
  };

  const config = sizeConfig[size];

  const getInitials = (name: string): string => {
    if (!name) return '?';
    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

  const getAvatarColors = (name: string): string[] => {
    const colors = [
      ['#FF6B6B', '#FF8E53'],
      ['#4ECDC4', '#44A08D'],
      ['#45B7D1', '#96C93D'],
      ['#96CEB4', '#FFECD2'],
      ['#DDA0DD', '#98FB98'],
      ['#F7DC6F', '#BB8FCE'],
      ['#85C1E9', '#F8C471'],
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const avatarColors = getAvatarColors(username);
  const initials = getInitials(username);

  return (
    <View style={[{ position: 'relative' }, style]}>
      <LinearGradient
        colors={avatarColors}
        style={[
          styles.avatar,
          {
            width: config.avatar,
            height: config.avatar,
            borderRadius: config.avatar / 2,
          },
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {username ? (
          <ThemedText 
            variant="inverse" 
            size={config.text} 
            weight="bold"
            style={styles.initials}
          >
            {initials}
          </ThemedText>
        ) : (
          <Ionicons name="person" size={config.icon} color="rgba(255,255,255,0.8)" />
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  initials: {
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});