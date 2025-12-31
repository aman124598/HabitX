import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { PremiumSplashScreen } from './PremiumSplashScreen';
import { SplashScreenManager } from './SplashScreenManager';

interface AppWrapperProps {
  children: React.ReactNode;
  enableSplashScreen?: boolean;
  splashDuration?: number;
}

export const AppWrapper: React.FC<AppWrapperProps> = ({
  children,
  enableSplashScreen = true,
  splashDuration = 3500,
}) => {
  const [isReady, setIsReady] = useState(false);
  const [showSplash, setShowSplash] = useState(enableSplashScreen);

  const handleSplashFinish = () => {
    setShowSplash(false);
    setIsReady(true);
  };

  if (enableSplashScreen && showSplash) {
    return (
      <SplashScreenManager
        onReady={handleSplashFinish}
        splashDuration={splashDuration}
      >
        {children}
      </SplashScreenManager>
    );
  }

  return <View style={{ flex: 1 }}>{children}</View>;
};

export default AppWrapper;