import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface ZLogoProps {
  size?: number;
  color?: string;
}

export default function ZLogo({ size = 24, color = '#E5A317' }: ZLogoProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Path
          d="M15 25 H65 L15 50 H65 L15 75 H85 V85 H5 V75 L45 50 L5 25 V15 H85 V25 H15 Z"
          fill={color}
        />
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