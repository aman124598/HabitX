import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  AppState,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText, ThemedCard } from '../Themed';
import { UserAvatar } from './UserAvatar';
import { NotificationBadge } from './NotificationBadge';
import { useFriends } from '../../lib/friendsContext';
import { useFriendActions } from '../../hooks/useFriendActions';
import { useTheme } from '../../lib/themeContext';
import { friendNotificationService } from '../../lib/friendNotificationService';
import { toastService } from '../../lib/toastService';
import Theme from '../../lib/theme';
import { FriendRequest, friendsApi } from '../../lib/friendsApi';
import { BackendStatusBanner } from '../BackendStatusBanner';
import { FEATURES } from '../../lib/config';

interface FriendRequestManagerProps {
  onNavigateToProfile?: (userId: string) => void;
  onNavigateToSearch?: () => void;
}

export function FriendRequestManager({ onNavigateToProfile, onNavigateToSearch }: FriendRequestManagerProps) {
  const { colors } = useTheme();
  const {
    friendRequests,
    isLoading,
    error,
    getFriendRequests,
    cancelFriendRequest,
    refreshFriendsData,
  } = useFriends();

  const {
    acceptFriendRequest,
    declineFriendRequest,
    respondingToRequest,
  } = useFriendActions();

  const [refreshing, setRefreshing] = useState(false);
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());
  const [serverHealthy, setServerHealthy] = useState<boolean | null>(null);

  const loadFriendRequests = useCallback(async (retryCount = 0) => {
    console.log('🔄 LoadFriendRequests called, retry count:', retryCount);
    try {
      await getFriendRequests();
      console.log('✅ Friend requests loaded successfully');
    } catch (error: any) {
      console.log('❌ Failed to load friend requests:', error.message, 'Status:', error.status);
      
      // Handle specific backend data corruption error
      if (error.message?.includes('toISOString') || error.message?.includes('formatting error')) {
        console.error('🐛 Backend data corruption detected - stopping retry attempts');
        if (retryCount === 0) { // Only show toast once
          toastService.friendDataCorruption();
        }
        return; // Don't retry for data corruption issues
      }
      
      // For 500 errors, don't retry automatically - let user manually refresh
      if (error.status === 500) {
        console.log('⚠️ 500 error detected, not retrying automatically');
        if (retryCount === 0) { // Only show toast once
          toastService.friendSystemError('Friend requests temporarily unavailable. You can try refreshing.');
        }
        return; // Don't auto-retry 500 errors to reduce spam
      }
      
      // Disable automatic retry for now to prevent loops
      // if (error.status !== 500 && retryCount < 2) {
      //   console.log(`Retrying friend requests load (attempt ${retryCount + 1}/3)...`);
      //   setTimeout(() => {
      //     loadFriendRequests(retryCount + 1);
      //   }, (retryCount + 1) * 2000); // Progressive delay: 2s, 4s
      // }
    }
  }, [getFriendRequests]);

  // Update notification count when friend requests change
  useEffect(() => {
    const updateNotifications = async () => {
      try {
        const count = friendRequests?.received?.length || 0;
        await friendNotificationService.updateFriendRequestCount(count);
      } catch (error) {
        console.error('Failed to update notification count:', error);
      }
    };
    
    updateNotifications();
  }, [friendRequests]);

  // Load friend requests on mount and when focused
  useEffect(() => {
    loadFriendRequests();
    
    // Temporarily disabled automatic refresh to prevent infinite loops
    // const refreshInterval = setInterval(() => {
    //   loadFriendRequests();
    // }, 60000); // Refresh every 60 seconds instead of 30
    
    // Handle app state changes for better real-time updates
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        // Refresh when app comes to foreground
        loadFriendRequests();
      }
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      // clearInterval(refreshInterval);
      subscription?.remove();
    };
  }, [loadFriendRequests]);

  // When there's an error, check backend health to differentiate server vs feature outage
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        if (error && !serverHealthy) { // Only check if we haven't already determined health status
          console.log('🏥 Checking backend health due to error:', error);
          const healthy = await friendsApi.healthCheck();
          console.log('🏥 Health check result:', healthy);
          if (!cancelled) setServerHealthy(healthy);
        } else if (!error) {
          if (!cancelled) setServerHealthy(null);
        }
      } catch (healthError) {
        console.log('🏥 Health check failed:', healthError);
        if (!cancelled) setServerHealthy(false);
      }
    };
    
    // Add a small delay to prevent rapid health checks
    const timeout = setTimeout(check, 1000);
    return () => { 
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [error, serverHealthy]);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await refreshFriendsData();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshFriendsData]);

  const handleAcceptRequest = useCallback(async (request: FriendRequest) => {
    try {
      setProcessingRequests(prev => new Set(prev).add(request.id));
      await acceptFriendRequest(request.id, request.requester.username);
      
      // Send notification to the requester that their request was accepted
      await friendNotificationService.sendFriendRequestAcceptedNotification(
        request.requester.username,
        request.requester.level,
        request.requester.totalXP
      );
      
      // Refresh data
      await loadFriendRequests();
    } catch (error) {
      console.error('Failed to accept friend request:', error);
      // Show user-facing error so users know acceptance failed
      toastService.error('Failed to Accept Request', (error as any)?.message || 'Unable to accept friend request. Please try again.');
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(request.id);
        return newSet;
      });
    }
  }, [acceptFriendRequest, loadFriendRequests]);

  const handleDeclineRequest = useCallback(async (request: FriendRequest) => {
    Alert.alert(
      'Decline Friend Request',
      `Are you sure you want to decline the friend request from ${request.requester.username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessingRequests(prev => new Set(prev).add(request.id));
              await declineFriendRequest(request.id, request.requester.username);
              await loadFriendRequests();
            } catch (error: any) {
              console.error('Failed to decline friend request:', error);
              toastService.error('Failed to Decline Request', error.message || 'Unable to decline friend request. Please try again.');
            } finally {
              setProcessingRequests(prev => {
                const newSet = new Set(prev);
                newSet.delete(request.id);
                return newSet;
              });
            }
          },
        },
      ]
    );
  }, [declineFriendRequest, loadFriendRequests]);

  const handleCancelRequest = useCallback(async (request: FriendRequest) => {
    Alert.alert(
      'Cancel Friend Request',
      `Are you sure you want to cancel your friend request to ${request.recipient.username}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Cancel Request',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessingRequests(prev => new Set(prev).add(request.id));
              await cancelFriendRequest(request.id);
              await loadFriendRequests();
              toastService.success('Request Cancelled', `Your friend request to ${request.recipient.username} has been cancelled.`);
            } catch (error: any) {
              console.error('Failed to cancel friend request:', error);
              toastService.error('Failed to Cancel Request', error.message || 'Unable to cancel friend request. Please try again.');
            } finally {
              setProcessingRequests(prev => {
                const newSet = new Set(prev);
                newSet.delete(request.id);
                return newSet;
              });
            }
          },
        },
      ]
    );
  }, [loadFriendRequests]);

  const handleViewProfile = useCallback((userId: string) => {
    if (onNavigateToProfile) {
      onNavigateToProfile(userId);
    }
  }, [onNavigateToProfile]);

  const renderRequestItem = (request: FriendRequest) => {
    const isProcessing = processingRequests.has(request.id);
    
    // Debug logging to identify incorrect categorization
    if (__DEV__) {
      console.log('🔍 Rendering received request:', {
        requestId: request.id,
        requester: request.requester.username,
        recipient: request.recipient.username,
        status: request.status
      });
    }
    
    return (
      <ThemedCard key={request.id} variant="elevated" style={styles.requestCard}>
        <View style={styles.requestContent}>
          <TouchableOpacity
            style={styles.requestInfo}
            onPress={() => handleViewProfile(request.requester.id)}
            activeOpacity={0.7}
          >
            <UserAvatar 
              username={request.requester.username}
              level={request.requester.level}
              size="medium"
              showLevel
            />
            <View style={styles.requestDetails}>
              <ThemedText variant="primary" size="lg" weight="semibold">
                {request.requester.username}
              </ThemedText>
              <ThemedText variant="secondary" size="sm">
                Level {request.requester.level} • {request.requester.totalXP.toLocaleString()} XP
              </ThemedText>
              {request.requester.bio && (
                <ThemedText variant="tertiary" size="xs" style={styles.bio}>
                  {request.requester.bio}
                </ThemedText>
              )}
              <ThemedText variant="tertiary" size="xs" style={styles.requestTime}>
                {new Date(request.createdAt).toLocaleDateString()}
              </ThemedText>
            </View>
          </TouchableOpacity>
          
          <View style={styles.requestActions}>
            {isProcessing ? (
              <ActivityIndicator size="small" color={colors.brand.primary} />
            ) : (
              <>
                {FEATURES.friendRequests ? (
                  <>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.acceptButton, { backgroundColor: colors.status.success }]}
                      onPress={() => handleAcceptRequest(request)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="checkmark" size={20} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.declineButton, { backgroundColor: colors.status.error }]}
                      onPress={() => handleDeclineRequest(request)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="close" size={20} color="white" />
                    </TouchableOpacity>
                  </>
                ) : (
                  <ThemedText variant="tertiary" size="xs">Friend requests disabled</ThemedText>
                )}
              </>
            )}
          </View>
        </View>
      </ThemedCard>
    );
  };

  const renderSentRequestItem = (request: FriendRequest) => {
    const isProcessing = processingRequests.has(request.id);
    
    // Debug logging to identify incorrect categorization
    if (__DEV__) {
      console.log('🔍 Rendering sent request:', {
        requestId: request.id,
        requester: request.requester.username,
        recipient: request.recipient.username,
        status: request.status
      });
    }
    
    return (
      <ThemedCard key={request.id} variant="outlined" style={styles.sentRequestCard}>
        <View style={styles.requestContent}>
          <TouchableOpacity
            style={styles.requestInfo}
            onPress={() => handleViewProfile(request.recipient.id)}
            activeOpacity={0.7}
          >
            <UserAvatar 
              username={request.recipient.username}
              level={request.recipient.level}
              size="medium"
              showLevel
            />
            <View style={styles.requestDetails}>
              <ThemedText variant="primary" size="lg" weight="semibold">
                {request.recipient.username}
              </ThemedText>
              <ThemedText variant="secondary" size="sm">
                Level {request.recipient.level} • {request.recipient.totalXP.toLocaleString()} XP
              </ThemedText>
              <View style={styles.statusContainer}>
                <View style={[styles.statusBadge, { backgroundColor: `${colors.status.warning}20` }]}>
                  <ThemedText
                    variant="tertiary"
                    size="xs"
                    weight="medium"
                    style={{ color: colors.status.warning }}
                  >
                    Pending
                  </ThemedText>
                </View>
              </View>
              <ThemedText variant="tertiary" size="xs" style={styles.requestTime}>
                Sent on {new Date(request.createdAt).toLocaleDateString()}
              </ThemedText>
            </View>
          </TouchableOpacity>
          
          <View style={styles.requestActions}>
            {isProcessing ? (
              <ActivityIndicator size="small" color={colors.brand.primary} />
            ) : (
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton, { backgroundColor: colors.status.error }]}
                onPress={() => handleCancelRequest(request)}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={20} color="white" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ThemedCard>
    );
  };

  const renderHeader = () => {
    const receivedCount = friendRequests?.received.length || 0;
    const sentCount = friendRequests?.sent.length || 0;
    
    return (
      <LinearGradient
        colors={[colors.brand.primary, colors.brand.secondary]}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <ThemedText variant="inverse" size="xl" weight="bold">
              Friend Requests
            </ThemedText>
            <ThemedText variant="inverse" size="sm" style={styles.subtitle}>
              {receivedCount > 0 && `${receivedCount} pending request${receivedCount !== 1 ? 's' : ''}`}
              {receivedCount > 0 && sentCount > 0 && ' • '}
              {sentCount > 0 && `${sentCount} sent`}
            </ThemedText>
          </View>
          {FEATURES.friendRequests && onNavigateToSearch && (
            <TouchableOpacity
              style={styles.searchButton}
              onPress={onNavigateToSearch}
              activeOpacity={0.8}
            >
              <Ionicons name="person-add" size={24} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    );
  };

  const renderContent = () => {
    if (isLoading && !refreshing) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
          <ThemedText variant="secondary" size="base" style={styles.loadingText}>
            Loading friend requests...
          </ThemedText>
        </View>
      );
    }

    const receivedRequests = friendRequests?.received || [];
    const sentRequests = friendRequests?.sent || [];
    const hasReceivedRequests = receivedRequests.length > 0;
    const hasSentRequests = sentRequests.length > 0;

    return (
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.brand.primary]}
            tintColor={colors.brand.primary}
          />
        }
      >
        {/* Received Requests Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText variant="primary" size="lg" weight="bold">
              Received Requests
            </ThemedText>
            {hasReceivedRequests && (
              <View style={styles.sectionBadge}>
                <NotificationBadge count={receivedRequests.length} size="medium" />
              </View>
            )}
          </View>
          
          {hasReceivedRequests ? (
            receivedRequests.map(renderRequestItem)
          ) : error?.includes('temporarily disabled') || error?.includes('503') ? (
            <ThemedCard variant="outlined" style={styles.warningCard}>
              <View style={styles.emptyContent}>
                <Ionicons name="time" size={48} color={colors.status.warning} />
                <ThemedText variant="primary" size="base" weight="semibold" style={styles.emptyTitle}>
                  Service Temporarily Disabled
                </ThemedText>
                <ThemedText variant="secondary" size="sm" style={styles.emptyDescription}>
                  Friend requests are temporarily disabled due to server issues. Service will resume automatically in about a minute.
                </ThemedText>
                <TouchableOpacity
                  style={[styles.warningButton, { backgroundColor: colors.status.warning }]}
                  onPress={() => loadFriendRequests()}
                  activeOpacity={0.8}
                >
                  <ThemedText variant="inverse" size="sm" weight="medium">
                    Try Again
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </ThemedCard>
          ) : error?.includes('corruption') || error?.includes('toISOString') ? (
            <ThemedCard variant="outlined" style={styles.errorCard}>
              <View style={styles.emptyContent}>
                <Ionicons name="warning" size={48} color={colors.status.error} />
                <ThemedText variant="primary" size="base" weight="semibold" style={styles.emptyTitle}>
                  Data Issue Detected
                </ThemedText>
                <ThemedText variant="secondary" size="sm" style={styles.emptyDescription}>
                  Friend request data needs repair on the server. Our team has been notified and is working on a fix.
                </ThemedText>
                <TouchableOpacity
                  style={[styles.errorButton, { backgroundColor: colors.status.error }]}
                  onPress={() => {
                    // Show technical details for developers
                    toastService.info('Technical Details', 'Check console for backend fix instructions');
                    console.log('🔧 BACKEND FIX NEEDED: See BACKEND_FIX_REQUIRED.md for complete solution');
                  }}
                  activeOpacity={0.8}
                >
                  <ThemedText variant="inverse" size="sm" weight="medium">
                    View Technical Details
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </ThemedCard>
          ) : (
            <ThemedCard variant="outlined" style={styles.emptyCard}>
              <View style={styles.emptyContent}>
                <Ionicons name="person-outline" size={48} color={colors.text.tertiary} />
                <ThemedText variant="secondary" size="base" weight="semibold" style={styles.emptyTitle}>
                  No Friend Requests
                </ThemedText>
                <ThemedText variant="tertiary" size="sm" style={styles.emptyDescription}>
                  When someone sends you a friend request, it will appear here.
                </ThemedText>
              </View>
            </ThemedCard>
          )}
        </View>

        {/* Sent Requests Section */}
        {hasSentRequests && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText variant="primary" size="lg" weight="bold">
                Sent Requests
              </ThemedText>
              <View style={styles.sectionBadge}>
                <ThemedText variant="secondary" size="sm">
                  {sentRequests.length}
                </ThemedText>
              </View>
            </View>
            {sentRequests.map(renderSentRequestItem)}
          </View>
        )}

        {/* Find Friends CTA */}
        {!hasReceivedRequests && !hasSentRequests && FEATURES.friendRequests && onNavigateToSearch && (
          <View style={styles.section}>
            <ThemedCard variant="elevated" style={styles.ctaCard}>
              <View style={styles.ctaContent}>
                <Ionicons name="people" size={64} color={colors.brand.primary} />
                <ThemedText variant="primary" size="lg" weight="bold" style={styles.ctaTitle}>
                  Start Building Your Network
                </ThemedText>
                <ThemedText variant="secondary" size="base" style={styles.ctaDescription}>
                  Find friends to stay motivated together on your habit-building journey!
                </ThemedText>
                <TouchableOpacity
                  style={[styles.ctaButton, { backgroundColor: colors.brand.primary }]}
                  onPress={onNavigateToSearch}
                  activeOpacity={0.8}
                >
                  <Ionicons name="search" size={20} color="white" />
                  <ThemedText variant="inverse" size="base" weight="semibold" style={styles.ctaButtonText}>
                    Find Friends
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </ThemedCard>
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {renderHeader()}
      <BackendStatusBanner onRetry={() => loadFriendRequests()} />
      {/* If backend is healthy but requests fail, show clear limited-service indicator */}
      {serverHealthy && error && !/network/i.test(error) && (
        <ThemedCard variant="outlined" style={styles.infoCard}>
          <View style={styles.emptyContent}>
            <Ionicons name="information-circle" size={24} color={colors.status.info} />
            <ThemedText variant="primary" size="base" weight="semibold" style={styles.emptyTitle}>
              Server OK • Friend Requests Limited
            </ThemedText>
            <ThemedText variant="secondary" size="sm" style={styles.emptyDescription}>
              The server is online, but the friend requests endpoint is temporarily unavailable.
            </ThemedText>
          </View>
        </ThemedCard>
      )}
      {error && (
        <View style={[styles.errorContainer, { backgroundColor: colors.status.error }]}>
          <View style={styles.errorContent}>
            <Ionicons name="warning" size={20} color="white" style={styles.errorIcon} />
            <View style={styles.errorTextContainer}>
              <ThemedText variant="inverse" size="sm">
                {error}
              </ThemedText>
            </View>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => loadFriendRequests()}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={18} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      )}
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingBottom: Theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing.md,
    paddingBottom: Theme.spacing.sm,
  },
  headerContent: {
    flex: 1,
  },
  subtitle: {
    opacity: 0.9,
    marginTop: 4,
  },
  searchButton: {
    padding: Theme.spacing.sm,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  content: {
    flex: 1,
    paddingHorizontal: Theme.spacing.lg,
  },
  section: {
    marginTop: Theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  sectionBadge: {
    marginLeft: Theme.spacing.sm,
  },
  requestCard: {
    marginBottom: Theme.spacing.md,
  },
  sentRequestCard: {
    marginBottom: Theme.spacing.md,
    opacity: 0.8,
  },
  requestContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.lg,
  },
  requestInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestDetails: {
    flex: 1,
    marginLeft: Theme.spacing.md,
  },
  bio: {
    marginTop: 2,
  },
  requestTime: {
    marginTop: 4,
  },
  statusContainer: {
    marginTop: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  requestActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  declineButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cancelButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyCard: {
    padding: Theme.spacing.xl,
  },
  emptyContent: {
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
  },
  emptyDescription: {
    textAlign: 'center',
  },
  ctaCard: {
    padding: Theme.spacing.xl,
  },
  ctaContent: {
    alignItems: 'center',
  },
  ctaTitle: {
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
    textAlign: 'center',
  },
  ctaDescription: {
    textAlign: 'center',
    marginBottom: Theme.spacing.lg,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    gap: Theme.spacing.sm,
  },
  ctaButtonText: {
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Theme.spacing.xl,
  },
  loadingText: {
    marginTop: Theme.spacing.md,
  },
  errorContainer: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorIcon: {
    marginRight: Theme.spacing.sm,
  },
  errorTextContainer: {
    flex: 1,
    marginRight: Theme.spacing.sm,
  },
  retryButton: {
    padding: Theme.spacing.sm,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  bottomSpacing: {
    height: Theme.spacing.xl,
  },
  errorCard: {
    padding: Theme.spacing.xl,
    borderColor: '#ff6b6b',
    backgroundColor: 'rgba(255, 107, 107, 0.05)',
  },
  errorButton: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.sm,
    marginTop: Theme.spacing.md,
    alignItems: 'center',
  },
  warningCard: {
    padding: Theme.spacing.xl,
    borderColor: '#f39c12',
    backgroundColor: 'rgba(243, 156, 18, 0.05)',
  },
  warningButton: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.sm,
    marginTop: Theme.spacing.md,
    alignItems: 'center',
  },
  infoCard: {
    padding: Theme.spacing.xl,
    borderColor: '#3498db',
    backgroundColor: 'rgba(52, 152, 219, 0.06)',
  },
});