import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '../Themed';
import { useTheme } from '../../lib/themeContext';

interface NotificationBadgeProps {
  count: number;
  size?: 'small' | 'medium';
  showZero?: boolean;
}

export function NotificationBadge({ count, size = 'small', showZero = false }: NotificationBadgeProps) {
  const { colors } = useTheme();

  if (count === 0 && !showZero) {
    return null;
  }

  const sizeStyles = {
    small: {
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      paddingHorizontal: 4,
    },
    medium: {
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      paddingHorizontal: 6,
    },
  };

  const textSize = size === 'small' ? 'xs' : 'sm';
  const displayCount = count > 99 ? '99+' : count.toString();

  return (
    <View
      style={[
        styles.badge,
        sizeStyles[size],
        { backgroundColor: colors.status.error },
      ]}
    >
      <ThemedText 
        variant="inverse" 
        size={textSize as any} 
        weight="bold"
        style={styles.text}
      >
        {displayCount}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: -6,
    right: -6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  text: {
    fontSize: 10,
    lineHeight: 12,
  },
});