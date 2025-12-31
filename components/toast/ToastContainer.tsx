import React from 'react';
import { View, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast } from '../../lib/toastContext';
import Toast from './Toast';
import Theme from '../../lib/theme';

export interface ToastContainerProps {
  position?: 'top' | 'bottom';
  offset?: number;
}

export default function ToastContainer({ 
  position = 'top', 
  offset = 0 
}: ToastContainerProps) {
  const { toasts, hideToast } = useToast();
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) {
    return null;
  }

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      left: 0,
      right: 0,
      zIndex: 9999,
      pointerEvents: 'box-none',
    },
    
    topContainer: {
      top: Platform.OS === 'ios' ? insets.top + offset : offset + Theme.spacing.xl,
    },
    
    bottomContainer: {
      bottom: Platform.OS === 'ios' ? insets.bottom + offset : offset + Theme.spacing.xl,
    },
    
    toastList: {
      paddingHorizontal: 0,
    },
  });

  const containerStyle = [
    styles.container,
    position === 'top' ? styles.topContainer : styles.bottomContainer,
  ];

  return (
    <View style={containerStyle}>
      <View style={styles.toastList}>
        {toasts.map((toast, index) => (
          <Toast
            key={toast.id}
            toast={toast}
            onHide={hideToast}
            index={index}
          />
        ))}
      </View>
    </View>
  );
}