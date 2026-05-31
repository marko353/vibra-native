import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuthContext } from '../../context/AuthContext';
import { useProfileContext } from '../../context/ProfileContext';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ModalDragHandle, ModalHeader, modalStyles } from '../../components/ModalTemplate';

const API_B = process.env.EXPO_PUBLIC_API_BASE_URL;

const COLORS = {
  primary: '#ff7f00',
  textPrimary: '#1a1a1a',
  textSecondary: '#999',
  border: '#ECECEC',
  selectedBg: '#fff5ec',
  selectedBorder: '#ffd0a8',
};

const OPTIONS = [
  { value: 'Quality time', emoji: '⏳', description: 'Spending meaningful time together.' },
  { value: 'Acts of kindness', emoji: '🤝', description: 'Showing love through helpful gestures.' },
  { value: 'Physical touch', emoji: '🤗', description: 'Expressing affection through touch.' },
  { value: 'Gifts', emoji: '🎁', description: 'Giving and receiving thoughtful gifts.' },
  { value: 'Words of affirmation', emoji: '💬', description: 'Expressing love through words and compliments.' },
];

interface MutationPayload { field: string; value: any; }
interface UserProfile { loveStyle: string | null; [key: string]: any; }

export default function LoveStyleScreen() {
  const router = useRouter();
  const { user } = useAuthContext();
  const { setProfileField } = useProfileContext();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  const { data: userProfile, isLoading: isProfileLoading, refetch } = useQuery<UserProfile>({
    queryKey: ['userProfile', user?.id],
    queryFn: async () => {
      if (!user?.token) throw new Error("Token not available");
      const response = await axios.get(`${API_B}/api/user/profile`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      return response.data;
    },
    enabled: !!user?.token,
  });

  const [selected, setSelected] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (user?.token) refetch();
    }, [user, refetch])
  );

  useEffect(() => {
    if (userProfile?.loveStyle) setSelected(userProfile.loveStyle);
  }, [userProfile]);

  const hasChanges = useMemo(() =>
    selected !== userProfile?.loveStyle,
    [selected, userProfile]
  );

  const mutation = useMutation({
    mutationFn: async (payload: MutationPayload) => {
      if (!user?.token) throw new Error("Token not available");
      const response = await axios.put(`${API_B}/api/user/update-profile`, payload, {
        headers: { Authorization: `Bearer ${user.token}`, 'Content-Type': 'application/json' },
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      setProfileField('loveStyle', variables.value);
      queryClient.setQueryData(['userProfile', user?.id], (old: any) =>
        old ? { ...old, loveStyle: variables.value } : old
      );
      router.back();
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || error.message);
    },
  });

  const handleSave = () => {
    if (!selected || !hasChanges || mutation.isPending || isProfileLoading) return;
    mutation.mutate({ field: 'loveStyle', value: selected });
  };

  const renderItem = ({ item }: { item: typeof OPTIONS[0] }) => {
    const isSelected = item.value === selected;
    return (
      <TouchableOpacity
        style={[styles.option, isSelected && styles.optionSelected]}
        onPress={() => setSelected(item.value)}
        disabled={mutation.isPending || isProfileLoading}
        activeOpacity={0.7}
      >
        <View style={[styles.emojiBox, isSelected && styles.emojiBoxSelected]}>
          <Text style={styles.emoji}>{item.emoji}</Text>
        </View>
        <View style={styles.optionContent}>
          <Text style={[styles.optionTitle, isSelected && styles.optionTitleSelected]}>
            {item.value}
          </Text>
          <Text style={styles.optionDescription}>{item.description}</Text>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[modalStyles.container, { paddingBottom: insets.bottom || 16 }]}>
      <ModalDragHandle />
      <ModalHeader
        title="Love language"
        onClose={() => router.back()}
        onSave={handleSave}
        hasChanges={hasChanges && !!selected}
        isPending={mutation.isPending || isProfileLoading}
      />

      {isProfileLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <>
          <Text style={styles.subtitle}>How do you prefer to give and receive love?</Text>
          <FlatList
            data={OPTIONS}
            renderItem={renderItem}
            keyExtractor={(item) => item.value}
            contentContainerStyle={modalStyles.list}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: '#fff',
    marginBottom: 10,
    gap: 12,
  },
  optionSelected: {
    borderColor: COLORS.selectedBorder,
    backgroundColor: COLORS.selectedBg,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  emojiBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  emojiBoxSelected: {
    backgroundColor: COLORS.selectedBg,
    borderWidth: 1,
    borderColor: COLORS.selectedBorder,
  },
  emoji: {
    fontSize: 20,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  optionTitleSelected: {
    color: COLORS.primary,
  },
  optionDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});