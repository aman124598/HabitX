import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect, Path } from 'react-native-svg';

interface ZLogoProps {
  size?: number;
  color?: string;
}

/**
 * Minimalist HabitX logo:
 *   Red rounded-rect → White "H" in center.
 */
export default function ZLogo({ size = 24, color }: ZLogoProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {/* Red rounded-rect background */}
        <Rect
          x="0" y="0" width="100" height="100"
          rx="21" ry="21"
          fill={color || '#DC2626'}
        />

        {/* White "H" */}
        {/* Stem 1 */}
        <Rect x="28" y="25" width="11" height="50" fill="white" />
        {/* Stem 2 */}
        <Rect x="61" y="25" width="11" height="50" fill="white" />
        {/* Crossbar */}
        <Rect x="39" y="45.5" width="22" height="9" fill="white" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});