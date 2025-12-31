import React from 'react';
import ChallengeDetailsScreen from '../components/challenges/ChallengeDetailsScreen';
import { useLocalSearchParams } from 'expo-router';

export default function Page() {
  const params = useLocalSearchParams();
  const challengeId = params.challengeId as string;
  
  return (
    <ChallengeDetailsScreen
      route={{ params: { challengeId: challengeId || '' } }}
      navigation={{ navigate: () => {} }}
    />
  );
}
