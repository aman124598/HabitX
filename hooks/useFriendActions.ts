import { useState, useCallback } from 'react';
import { useFriends } from '../lib/friendsContext';
import { Alert } from 'react-native';
import { toastService } from '../lib/toastService';
import { FEATURES } from '../lib/config';

export interface UseFriendActionsReturn {
  sendingRequest: boolean;
  removingFriend: boolean;
  respondingToRequest: boolean;
  sendFriendRequestWithConfirm: (userId: string, username: string) => Promise<void>;
  removeFriendWithConfirm: (friendId: string, username: string) => Promise<void>;
  acceptFriendRequest: (requestId: string, username: string) => Promise<void>;
  declineFriendRequest: (requestId: string, username: string) => Promise<void>;
}

export function useFriendActions(): UseFriendActionsReturn {
  const { sendFriendRequest, removeFriend, respondToFriendRequest } = useFriends();
  
  const [sendingRequest, setSendingRequest] = useState(false);
  const [removingFriend, setRemovingFriend] = useState(false);
  const [respondingToRequest, setRespondingToRequest] = useState(false);

  const sendFriendRequestWithConfirm = useCallback(async (userId: string, username: string) => {
    if (!FEATURES.friendRequests) {
      toastService.warning('Feature disabled', 'Sending friend requests is currently disabled.');
      return;
    }
    Alert.alert(
      'Send Friend Request',
      `Send a friend request to ${username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            try {
              setSendingRequest(true);
              await sendFriendRequest(userId);
              toastService.friendRequestSent(username);
            } catch (error: any) {
              // Handle specific error messages from backend
              if (error.message?.includes('already sent') || error.message?.includes('duplicate')) {
                toastService.friendRequestAlreadySent(username);
              } else if (error.message?.includes('already friends')) {
                toastService.friendRequestAlreadyFriends(username);
              } else {
                toastService.error('Failed to Send Request', error.message || 'Unable to send friend request. Please try again.');
              }
            } finally {
              setSendingRequest(false);
            }
          },
        },
      ]
    );
  }, [sendFriendRequest]);

  const removeFriendWithConfirm = useCallback(async (friendId: string, username: string) => {
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${username} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setRemovingFriend(true);
              await removeFriend(friendId);
              toastService.friendRemoved(username);
            } catch (error: any) {
              toastService.error('Failed to Remove Friend', error.message || 'Unable to remove friend. Please try again.');
            } finally {
              setRemovingFriend(false);
            }
          },
        },
      ]
    );
  }, [removeFriend]);

  const acceptFriendRequest = useCallback(async (requestId: string, username: string) => {
    if (!FEATURES.friendRequests) {
      toastService.warning('Feature disabled', 'Accepting friend requests is currently disabled.');
      return;
    }
    try {
      setRespondingToRequest(true);
      await respondToFriendRequest(requestId, 'accept');
      toastService.friendRequestAccepted(username);
      // Show friend added toast after a brief delay
      setTimeout(() => {
        toastService.friendAdded(username);
      }, 1500);
    } catch (error: any) {
      toastService.error('Failed to Accept Request', error.message || 'Unable to accept friend request. Please try again.');
    } finally {
      setRespondingToRequest(false);
    }
  }, [respondToFriendRequest]);

  const declineFriendRequest = useCallback(async (requestId: string, username: string) => {
    if (!FEATURES.friendRequests) {
      toastService.warning('Feature disabled', 'Declining friend requests is currently disabled.');
      return;
    }
    Alert.alert(
      'Decline Friend Request',
      `Decline friend request from ${username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              setRespondingToRequest(true);
              await respondToFriendRequest(requestId, 'decline');
              toastService.friendRequestDeclined(username);
            } catch (error: any) {
              toastService.error('Failed to Decline Request', error.message || 'Unable to decline friend request. Please try again.');
            } finally {
              setRespondingToRequest(false);
            }
          },
        },
      ]
    );
  }, [respondToFriendRequest]);

  return {
    sendingRequest,
    removingFriend,
    respondingToRequest,
    sendFriendRequestWithConfirm,
    removeFriendWithConfirm,
    acceptFriendRequest,
    declineFriendRequest,
  };
}