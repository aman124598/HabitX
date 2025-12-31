# Premium Splash Screen Implementation

## Overview

This premium splash screen system provides a polished, professional loading experience for your Habit Tracker app with smooth animations, particle effects, and gradient backgrounds.

## Features

- **Multi-layered animations**: Logo scaling, rotation, glow effects
- **Particle system**: Floating animated particles for depth
- **Dynamic gradients**: Smoothly transitioning background colors
- **Blur effects**: Glass-morphism design elements
- **Customizable duration**: Adjustable timing for different use cases
- **Professional typography**: Elegant text with shadows and effects
- **Corner decorations**: Subtle border elements for premium feel

## Components

### 1. PremiumSplashScreen
The main splash screen component with all premium effects.

**Props:**
- `onFinish: () => void` - Callback when splash finishes
- `duration?: number` - Duration in milliseconds (default: 3000)

### 2. SplashScreenManager
A wrapper that manages splash screen lifecycle and app initialization.

**Props:**
- `onReady: () => void` - Callback when app is ready
- `children: React.ReactNode` - App content to show after splash
- `showPremiumSplash?: boolean` - Enable/disable splash (default: true)
- `splashDuration?: number` - Duration in milliseconds (default: 3500)

### 3. AnimatedBackground
Reusable animated gradient background component.

**Props:**
- `children: React.ReactNode` - Content to overlay
- `colors?: string[]` - Gradient colors array
- `duration?: number` - Animation duration (default: 8000)

### 4. AppWrapper
Simple wrapper for easy integration.

**Props:**
- `children: React.ReactNode` - App content
- `enableSplashScreen?: boolean` - Enable/disable splash (default: true)
- `splashDuration?: number` - Duration in milliseconds (default: 3500)

## Installation

### Required Dependencies

Make sure you have these dependencies in your `package.json`:

```json
{
  "expo-linear-gradient": "~13.0.2",
  "expo-blur": "~13.0.2"
}
```

Install if needed:
```bash
npx expo install expo-linear-gradient expo-blur
```

## Usage

### Basic Implementation

```tsx
import React from 'react';
import { AppWrapper } from './components/ui/AppWrapper';
import YourMainApp from './YourMainApp';

export default function App() {
  return (
    <AppWrapper enableSplashScreen={true} splashDuration={3500}>
      <YourMainApp />
    </AppWrapper>
  );
}
```

### Direct Usage

```tsx
import React, { useState } from 'react';
import { PremiumSplashScreen } from './components/ui/PremiumSplashScreen';
import YourMainApp from './YourMainApp';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return (
      <PremiumSplashScreen
        onFinish={() => setShowSplash(false)}
        duration={3500}
      />
    );
  }

  return <YourMainApp />;
}
```

### With Existing App Layout

```tsx
import React from 'react';
import { SplashScreenManager } from './components/ui/SplashScreenManager';
import YourExistingApp from './YourExistingApp';

export default function App() {
  return (
    <SplashScreenManager
      onReady={() => console.log('App ready!')}
      showPremiumSplash={true}
      splashDuration={4000}
    >
      <YourExistingApp />
    </SplashScreenManager>
  );
}
```

## Customization

### Colors

Modify the gradient colors in any component:

```tsx
const customColors = [
  '#FF6B6B', // Coral
  '#4ECDC4', // Turquoise  
  '#45B7D1', // Blue
  '#96CEB4', // Mint
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
];

<AnimatedBackground colors={customColors}>
  {/* Your content */}
</AnimatedBackground>
```

### Animation Timing

Adjust animation phases:

```tsx
// In PremiumSplashScreen component
const sequence = Animated.sequence([
  // Phase 1: Logo entrance (faster)
  Animated.parallel([
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600, // Reduced from 800
      useNativeDriver: true,
    }),
    // ... other animations
  ]),
  // ... other phases
]);
```

### Logo Customization

Replace the default "H" logo:

```tsx
// In the logo section
<Text style={styles.logoText}>YourLogo</Text>

// Or use an image
<Image 
  source={require('./assets/logo.png')} 
  style={styles.logoImage}
  resizeMode="contain"
/>
```

### Particle Effects

Adjust particle count and behavior:

```tsx
// Change particle count
const particleAnims = useRef(
  Array.from({ length: 20 }, () => ({ // Increased from 8
    x: new Animated.Value(0),
    y: new Animated.Value(0),
    opacity: new Animated.Value(0),
    scale: new Animated.Value(0),
  }))
).current;
```

## Performance Tips

1. **Use native driver**: All animations use `useNativeDriver: true` for 60fps performance
2. **Optimize particles**: Reduce particle count on older devices
3. **Preload assets**: Load any images/fonts before showing splash
4. **Memory cleanup**: Animations are properly cleaned up on unmount

## Platform Considerations

### iOS
- Status bar is temporarily hidden for immersive experience
- Respects safe area automatically with proper styling

### Android
- Uses elevation for shadows instead of iOS shadowProps
- Handles different screen densities with responsive sizing

## Troubleshooting

### BlurView Issues
If blur effects don't work:
```bash
npx expo install expo-blur
# Ensure you're testing on device, not simulator
```

### Animation Performance
If animations are choppy:
- Reduce particle count
- Decrease animation complexity
- Test on physical device (simulators can be slower)

### Gradient Not Showing
Ensure expo-linear-gradient is properly installed:
```bash
npx expo install expo-linear-gradient
```

## File Structure

```
components/
└── ui/
    ├── PremiumSplashScreen.tsx    # Main splash component
    ├── SplashScreenManager.tsx    # Lifecycle manager
    ├── AnimatedBackground.tsx     # Reusable background
    ├── AppWrapper.tsx            # Simple wrapper
    └── README.md                 # This documentation
```

## Examples

The splash screen includes:
- ✨ Smooth logo entrance with spring animation
- 🌈 Multi-color gradient background with rotation
- ✨ Floating particle system
- 💎 Glass-morphism blur effects
- 🔄 Pulsing glow animations
- 📱 Professional typography
- 🎯 Corner decorative elements
- ⚡ High-performance native animations

Perfect for creating that premium first impression users expect from modern apps!