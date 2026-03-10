import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    Pressable,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
    withRepeat,
    withSequence,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from './Themed';
import { useTheme } from '../lib/themeContext';
import { formatElapsed } from '../lib/timerStorage';

/**
 * A floating capsule pill that appears at the top of the screen
 * whenever any habit timer is running.
 */

const RUNNING_KEY = 'timer:running';

function todayStr(): string {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

export default function TimerPill() {
    const { colors, isDark } = useTheme();
    const [runningHabitId, setRunningHabitId] = useState<string | null>(null);
    const [elapsed, setElapsed] = useState(0);
    const startedAtRef = useRef<number>(0);
    const baseElapsedRef = useRef<number>(0); // today's already-logged time

    // Pulse animation for the recording dot
    const dotOpacity = useSharedValue(1);
    // Slide-in animation from bottom
    const translateY = useSharedValue(120);

    // Poll for running timers every second
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;

        const check = async () => {
            try {
                const raw = await AsyncStorage.getItem(RUNNING_KEY);
                const running: Record<string, number> = raw ? JSON.parse(raw) : {};
                const ids = Object.keys(running);

                if (ids.length > 0) {
                    const id = ids[0];
                    const startedAt = running[id];
                    startedAtRef.current = startedAt;

                    // Read today's already-logged elapsed for this habit
                    const today = todayStr();
                    const logRaw = await AsyncStorage.getItem(`timer:log:${id}:${today}`);
                    const dayLog = logRaw ? JSON.parse(logRaw) : { elapsed: 0 };
                    baseElapsedRef.current = dayLog.elapsed || 0;

                    setRunningHabitId(id);
                    setElapsed(baseElapsedRef.current + (Date.now() - startedAt));
                } else {
                    if (runningHabitId) {
                        setRunningHabitId(null);
                        setElapsed(0);
                        startedAtRef.current = 0;
                        baseElapsedRef.current = 0;
                    }
                }
            } catch { }
        };

        check(); // initial check

        interval = setInterval(() => {
            if (startedAtRef.current > 0) {
                setElapsed(baseElapsedRef.current + (Date.now() - startedAtRef.current));
            }
            // Re-check storage every 3 seconds for start/stop changes
            check();
        }, 1000);

        return () => clearInterval(interval);
    }, [runningHabitId]);

    // Animate in/out
    useEffect(() => {
        if (runningHabitId) {
            translateY.value = withSpring(0, { damping: 14, stiffness: 200 });
            dotOpacity.value = withRepeat(
                withSequence(
                    withTiming(0.3, { duration: 800 }),
                    withTiming(1, { duration: 800 }),
                ),
                -1,
                true,
            );
        } else {
            translateY.value = withTiming(120, { duration: 200 });
        }
    }, [runningHabitId]);

    const slideStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    const dotStyle = useAnimatedStyle(() => ({
        opacity: dotOpacity.value,
    }));

    if (!runningHabitId && translateY.value >= 119) return null;

    return (
        <Animated.View
            style={[
                styles.container,
                slideStyle,
                {
                    backgroundColor: isDark ? '#1a2e1a' : '#e8f5e9',
                    borderColor: isDark ? '#2d4a2d' : '#a5d6a7',
                },
            ]}
        >
            {/* Pulsing dot */}
            <Animated.View style={[styles.dot, dotStyle, { backgroundColor: '#4CAF50' }]} />

            {/* Icon */}
            <Ionicons name="timer" size={15} color="#4CAF50" style={{ marginLeft: 4 }} />

            {/* Timer text */}
            <ThemedText
                size="sm"
                weight="bold"
                style={{
                    color: '#4CAF50',
                    fontVariant: ['tabular-nums'],
                    marginLeft: 6,
                }}
            >
                {formatElapsed(elapsed)}
            </ThemedText>

            <ThemedText
                size="xs"
                style={{
                    color: isDark ? '#81C784' : '#388E3C',
                    marginLeft: 6,
                }}
            >
                Timer running
            </ThemedText>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 100 : 80,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 24,
        borderWidth: 1,
        zIndex: 999,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
});
