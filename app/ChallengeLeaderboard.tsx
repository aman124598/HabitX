import React from 'react';
import ChallengeLeaderboardScreen from '../components/challenges/ChallengeLeaderboardScreen';
import { useLocalSearchParams } from 'expo-router';

export default function Page() {
  const params = useLocalSearchParams();
  const challengeId = params.challengeId as string;
  
  return (
    <ChallengeLeaderboardScreen
      route={{ params: { challengeId: challengeId || '' } }}
      navigation={{ navigate: () => {} }}
    />
  );
}
