import React, { useMemo } from 'react';
import { View, StyleSheet, Text, Image } from 'react-native';
import Theme from '../lib/theme';
import { useTheme } from '../lib/themeContext';

interface UserAvatarProps {
  username: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLevel?: boolean;
  level?: number;
}

export function UserAvatar({ 
  username, 
  avatarUrl, 
  size = 'md', 
  showLevel = false,
  level = 1 
}: UserAvatarProps) {
  const { colors } = useTheme();

  const dimensions = {
    sm: 32,
    md: 48,
    lg: 64,
    xl: 96,
  };
  
  const fontSize = {
    sm: 12,
    md: 18,
    lg: 24,
    xl: 36,
  };

  const currentSize = dimensions[size];
  const currentFontSize = fontSize[size];

  // Generate a consistent color based on username
  const avatarColor = useMemo(() => {
    const colors = [
      '#EF4444', // red-500
      '#F59E0B', // amber-500
      '#10B981', // emerald-500
      '#3B82F6', // blue-500
      '#6366F1', // indigo-500
      '#8B5CF6', // violet-500
      '#EC4899', // pink-500
      '#F97316', // orange-500
      '#06B6D4', // cyan-500
    ];
    
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  }, [username]);

  const initials = username
    ? username.substring(0, 2).toUpperCase()
    : '??';

  return (
    <View style={[styles.container, { width: currentSize, height: currentSize }]}>
      {avatarUrl ? (
        <Image 
          source={{ uri: avatarUrl }} 
          style={[
            styles.image, 
            { 
              width: currentSize, 
              height: currentSize,
              borderRadius: currentSize / 2,
              backgroundColor: colors.surface.secondary
            }
          ]} 
        />
      ) : (
        <View 
          style={[
            styles.placeholder, 
            { 
              width: currentSize, 
              height: currentSize, 
              borderRadius: currentSize / 2,
              backgroundColor: avatarColor 
            }
          ]}
        >
          <Text style={[styles.initials, { fontSize: currentFontSize }]}>
            {initials}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    resizeMode: 'cover',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
