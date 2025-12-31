import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../lib/themeContext';
import { friendsApi } from '../lib/friendsApi';
import Theme from '../lib/theme';

interface BackendStatusBannerProps {
  onRetry?: () => void;
}

export function BackendStatusBanner({ onRetry }: BackendStatusBannerProps) {
  const { colors } = useTheme();
  const [backendStatus, setBackendStatus] = useState<'checking' | 'healthy' | 'unhealthy'>('checking');
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  useEffect(() => {
    checkBackendHealth();
    
    // Check every 60 seconds
    const interval = setInterval(checkBackendHealth, 60000);
    return () => clearInterval(interval);
  }, []);

  const checkBackendHealth = async () => {
    try {
      const isHealthy = await friendsApi.healthCheck();
      setBackendStatus(isHealthy ? 'healthy' : 'unhealthy');
      setLastCheck(new Date());
    } catch (error) {
      setBackendStatus('unhealthy');
      setLastCheck(new Date());
    }
  };

  const handleRetry = () => {
    checkBackendHealth();
    onRetry?.();
  };

  // Don't show banner if backend is healthy
  if (backendStatus === 'healthy') {
    return null;
  }

  const getStatusInfo = () => {
    switch (backendStatus) {
      case 'checking':
        return {
          color: colors.status.warning,
          icon: 'refresh-outline' as const,
          title: 'Checking Connection...',
          message: 'Verifying server status',
          showRetry: false,
        };
      case 'unhealthy':
        return {
          color: colors.status.error,
          icon: 'warning' as const,
          title: 'Connection Issue',
          message: 'Server is temporarily unavailable. Some features may not work.',
          showRetry: true,
        };
      default:
        return {
          color: colors.status.success,
          icon: 'checkmark-circle' as const,
          title: 'Connected',
          message: 'All services are operational',
          showRetry: false,
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[`${statusInfo.color}20`, `${statusInfo.color}10`]}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.statusInfo}>
            <View style={[styles.iconContainer, { backgroundColor: statusInfo.color }]}>
              <Ionicons name={statusInfo.icon} size={16} color="white" />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.title, { color: colors.text.primary }]}>
                {statusInfo.title}
              </Text>
              <Text style={[styles.message, { color: colors.text.secondary }]}>
                {statusInfo.message}
              </Text>
              <Text style={[styles.timestamp, { color: colors.text.tertiary }]}>
                Last checked: {lastCheck.toLocaleTimeString()}
              </Text>
            </View>
          </View>
          
          {statusInfo.showRetry && (
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: statusInfo.color }]}
              onPress={handleRetry}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={16} color="white" />
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Theme.spacing.lg,
    marginVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    overflow: 'hidden',
  },
  gradient: {
    padding: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  message: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 10,
    fontStyle: 'italic',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.sm,
    gap: 4,
  },
  retryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});