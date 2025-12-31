import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { gamificationService } from '../../lib/gamificationService';
import { userGamificationService } from '../../lib/userGamificationApi';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DebugInfo {
  serverData: any;
  cachedData: any;
  backupData: any;
  timestamp: string;
}

export function XPDebugComponent() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const fetchDebugInfo = async () => {
    try {
      // Get server data
      const serverData = await userGamificationService.getUserGamification();
      
      // Get cached data
      const cachedData = gamificationService.getCachedUserGamification();
      
      // Get backup data
      let backupData = null;
      try {
        const backupStr = await AsyncStorage.getItem('user_gamification_backup');
        if (backupStr) {
          const backup = JSON.parse(backupStr);
          backupData = {
            data: backup.data,
            age: Math.round((Date.now() - backup.timestamp) / (60 * 1000)), // minutes
          };
        }
      } catch (error) {
        console.error('Failed to get backup data:', error);
      }

      setDebugInfo({
        serverData,
        cachedData,
        backupData,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      Alert.alert('Debug Error', error?.message || 'Unknown error occurred');
    }
  };

  const clearBackup = async () => {
    try {
      await AsyncStorage.removeItem('user_gamification_backup');
      Alert.alert('Backup Cleared', 'Local backup has been removed');
      fetchDebugInfo();
    } catch (error) {
      Alert.alert('Error', 'Failed to clear backup');
    }
  };

  const addTestXP = async () => {
    try {
      await userGamificationService.addXP(10);
      Alert.alert('Test XP Added', '10 XP has been added');
      fetchDebugInfo();
    } catch (error: any) {
      Alert.alert('Error', 'Failed to add test XP: ' + (error?.message || 'Unknown error'));
    }
  };

  if (!isVisible) {
    return (
      <TouchableOpacity 
        style={styles.toggleButton} 
        onPress={() => setIsVisible(true)}
      >
        <Text style={styles.toggleButtonText}>🐛 XP Debug</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>XP Debug Info</Text>
        <TouchableOpacity onPress={() => setIsVisible(false)}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={fetchDebugInfo}>
          <Text style={styles.actionText}>🔄 Refresh</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={addTestXP}>
          <Text style={styles.actionText}>➕ Test XP</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={clearBackup}>
          <Text style={styles.actionText}>🗑️ Clear Backup</Text>
        </TouchableOpacity>
      </View>

      {debugInfo && (
        <View style={styles.info}>
          <Text style={styles.timestamp}>Updated: {new Date(debugInfo.timestamp).toLocaleTimeString()}</Text>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🌐 Server Data:</Text>
            <Text style={styles.data}>
              XP: {debugInfo.serverData?.totalXP || 0} | Level: {debugInfo.serverData?.level || 1}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💾 Cached Data:</Text>
            <Text style={styles.data}>
              {debugInfo.cachedData 
                ? `XP: ${debugInfo.cachedData.totalXP} | Level: ${debugInfo.cachedData.level}`
                : 'No cached data'
              }
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📦 Backup Data:</Text>
            <Text style={styles.data}>
              {debugInfo.backupData 
                ? `XP: ${debugInfo.backupData.data.totalXP} | Level: ${debugInfo.backupData.data.level} (${debugInfo.backupData.age}m old)`
                : 'No backup data'
              }
            </Text>
          </View>

          {debugInfo.serverData?.totalXP === 0 && debugInfo.backupData?.data?.totalXP > 0 && (
            <View style={[styles.section, styles.warning]}>
              <Text style={styles.warningText}>⚠️ SERVER SHOWS 0 XP BUT BACKUP HAS {debugInfo.backupData.data.totalXP} XP!</Text>
              <Text style={styles.warningText}>This indicates a data loss issue.</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  toggleButton: {
    position: 'absolute',
    top: 100,
    right: 10,
    backgroundColor: '#FF6B35',
    padding: 8,
    borderRadius: 20,
    zIndex: 1000,
  },
  toggleButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  container: {
    position: 'absolute',
    top: 50,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 10,
    padding: 15,
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 5,
  },
  actionText: {
    color: 'white',
    fontSize: 12,
  },
  info: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 10,
  },
  timestamp: {
    color: '#AAA',
    fontSize: 10,
    marginBottom: 10,
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  data: {
    color: '#CCC',
    fontSize: 11,
    marginLeft: 10,
  },
  warning: {
    backgroundColor: '#FF4444',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  warningText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});