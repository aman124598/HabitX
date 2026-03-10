import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    Pressable,
    TextInput,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '../Themed';
import { useAuth } from '../../lib/authContext';
import { useTheme } from '../../lib/themeContext';

const AVATAR_STORAGE_KEY = '@habit_user_avatar';

interface EditProfileModalProps {
    visible: boolean;
    onClose: () => void;
}

export default function EditProfileModal({ visible, onClose }: EditProfileModalProps) {
    const { user, updateProfile } = useAuth();
    const { colors, isDark } = useTheme();
    const [username, setUsername] = useState(user?.username || '');
    const [avatarUri, setAvatarUri] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Sync state when modal opens
    useEffect(() => {
        if (visible) {
            setUsername(user?.username || '');
            setHasChanges(false);
            AsyncStorage.getItem(AVATAR_STORAGE_KEY).then(stored => {
                setAvatarUri(stored || user?.avatar || null);
            });
        }
    }, [visible, user]);

    // Directly open the gallery — no Alert, no extra permissions dialog
    const pickFromGallery = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Needed', 'Please allow photo library access in your device settings.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.3,
                base64: true,
            });

            if (!result.canceled && result.assets?.[0]) {
                const asset = result.assets[0];
                if (asset.base64) {
                    const mime = asset.mimeType || 'image/jpeg';
                    setAvatarUri(`data:${mime};base64,${asset.base64}`);
                    setHasChanges(true);
                } else if (asset.uri) {
                    setAvatarUri(asset.uri);
                    setHasChanges(true);
                }
            }
        } catch (err) {
            console.error('Gallery error:', err);
            Alert.alert('Error', 'Could not open gallery.');
        }
    };

    const removePhoto = () => {
        setAvatarUri(null);
        setHasChanges(true);
    };

    const handleSave = async () => {
        if (!username.trim()) {
            Alert.alert('Error', 'Name cannot be empty.');
            return;
        }
        try {
            setIsSaving(true);

            // Save avatar locally
            if (avatarUri) {
                await AsyncStorage.setItem(AVATAR_STORAGE_KEY, avatarUri);
            } else {
                await AsyncStorage.removeItem(AVATAR_STORAGE_KEY);
            }

            // Send username to API if changed
            if (username.trim() !== (user?.username || '')) {
                await updateProfile({ username: username.trim() });
            }

            Alert.alert('Success', 'Profile updated!');
            onClose();
        } catch (error: any) {
            console.error('Save error:', error);
            Alert.alert('Failed', error?.message || 'Could not update profile.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleClose = () => {
        if (hasChanges) {
            Alert.alert('Discard Changes?', 'You have unsaved changes.', [
                { text: 'Keep Editing', style: 'cancel' },
                { text: 'Discard', style: 'destructive', onPress: onClose },
            ]);
        } else {
            onClose();
        }
    };

    if (!visible) return null;

    const initials = (username || 'U').substring(0, 2).toUpperCase();

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.overlay}
        >
            <Pressable style={styles.overlay} onPress={handleClose}>
                <Pressable style={[styles.modal, { backgroundColor: colors.background.secondary }]} onPress={() => { }}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Pressable onPress={handleClose} hitSlop={12} style={styles.headerBtn}>
                            <ThemedText variant="secondary" size="base">Cancel</ThemedText>
                        </Pressable>
                        <ThemedText variant="primary" weight="bold" size="lg">Edit Profile</ThemedText>
                        <Pressable
                            onPress={handleSave}
                            disabled={isSaving || !hasChanges}
                            hitSlop={12}
                            style={[styles.headerBtn, (!hasChanges || isSaving) && { opacity: 0.4 }]}
                        >
                            {isSaving ? (
                                <ActivityIndicator size="small" color={colors.brand.primary} />
                            ) : (
                                <ThemedText weight="bold" size="base" style={{ color: colors.brand.primary }}>
                                    Save
                                </ThemedText>
                            )}
                        </Pressable>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
                        {/* ─── Avatar + Change Buttons ─── */}
                        <View style={styles.avatarSection}>
                            {/* Avatar display */}
                            <View style={[styles.avatarCircle, { backgroundColor: colors.brand.primary }]}>
                                {avatarUri ? (
                                    <Image
                                        source={{ uri: avatarUri }}
                                        style={styles.avatarImage}
                                    />
                                ) : (
                                    <ThemedText style={styles.avatarInitials}>{initials}</ThemedText>
                                )}
                            </View>

                            {/* Action buttons BELOW the avatar — not behind an Alert */}
                            <View style={styles.photoButtons}>
                                <Pressable
                                    onPress={pickFromGallery}
                                    style={[styles.photoBtn, { backgroundColor: `${colors.brand.primary}15` }]}
                                >
                                    <Ionicons name="image-outline" size={18} color={colors.brand.primary} />
                                    <ThemedText size="sm" weight="semibold" style={{ color: colors.brand.primary, marginLeft: 6 }}>
                                        Choose Photo
                                    </ThemedText>
                                </Pressable>

                                {avatarUri && (
                                    <Pressable
                                        onPress={removePhoto}
                                        style={[styles.photoBtn, { backgroundColor: `${colors.status.error}10` }]}
                                    >
                                        <Ionicons name="trash-outline" size={16} color={colors.status.error} />
                                        <ThemedText size="sm" style={{ color: colors.status.error, marginLeft: 6 }}>
                                            Remove
                                        </ThemedText>
                                    </Pressable>
                                )}
                            </View>
                        </View>

                        {/* ─── Name Input ─── */}
                        <View style={styles.field}>
                            <ThemedText variant="tertiary" weight="semibold" size="xs" style={styles.label}>
                                DISPLAY NAME
                            </ThemedText>
                            <View style={[styles.inputRow, { backgroundColor: colors.background.tertiary, borderColor: colors.border.light }]}>
                                <Ionicons name="person-outline" size={18} color={colors.text.tertiary} style={{ marginRight: 10 }} />
                                <TextInput
                                    style={[styles.input, { color: colors.text.primary }]}
                                    value={username}
                                    onChangeText={(t) => { setUsername(t); setHasChanges(true); }}
                                    placeholder="Your name"
                                    placeholderTextColor={colors.text.tertiary}
                                    autoCapitalize="words"
                                    maxLength={30}
                                />
                            </View>
                        </View>

                        {/* ─── Email (read-only) ─── */}
                        <View style={styles.field}>
                            <ThemedText variant="tertiary" weight="semibold" size="xs" style={styles.label}>
                                EMAIL
                            </ThemedText>
                            <View style={[styles.inputRow, { backgroundColor: colors.background.tertiary, borderColor: colors.border.light, opacity: 0.6 }]}>
                                <Ionicons name="mail-outline" size={18} color={colors.text.tertiary} style={{ marginRight: 10 }} />
                                <ThemedText variant="secondary" size="base">
                                    {user?.email || 'No email'}
                                </ThemedText>
                            </View>
                        </View>
                    </ScrollView>
                </Pressable>
            </Pressable>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modal: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '85%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(128,128,128,0.2)',
    },
    headerBtn: {
        minWidth: 60,
        alignItems: 'center',
        padding: 4,
    },
    body: {
        padding: 24,
        paddingBottom: 40,
    },

    // Avatar
    avatarSection: {
        alignItems: 'center',
        marginBottom: 28,
    },
    avatarCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarImage: {
        width: 96,
        height: 96,
        resizeMode: 'cover',
    },
    avatarInitials: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#fff',
    },
    photoButtons: {
        flexDirection: 'row',
        marginTop: 14,
        gap: 10,
    },
    photoBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
    },

    // Fields
    field: {
        marginBottom: 20,
    },
    label: {
        marginBottom: 8,
        marginLeft: 4,
        letterSpacing: 1,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 14,
        borderWidth: 1,
    },
    input: {
        flex: 1,
        fontSize: 16,
    },
});
