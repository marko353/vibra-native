import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
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
  inputBg: '#FAFAFA',
  inputBorderFocused: '#ffd0a8',
  white: '#fff',
};

interface MutationPayload { field: string; value: any; }
interface UserProfile { jobTitle: string | null; [key: string]: any; }

export default function JobScreen() {
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

  const [jobTitle, setJobTitle] = useState<string>('');
  const [isFocused, setIsFocused] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (user?.token) refetch();
    }, [user, refetch])
  );

  useEffect(() => {
    if (userProfile?.jobTitle) setJobTitle(userProfile.jobTitle);
  }, [userProfile]);

  const hasChanges = useMemo(() =>
    jobTitle.trim() !== (userProfile?.jobTitle || '').trim(),
    [jobTitle, userProfile]
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
      setProfileField('jobTitle', variables.value);
      queryClient.setQueryData(['userProfile', user?.id], (old: any) =>
        old ? { ...old, jobTitle: variables.value } : old
      );
      router.back();
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || error.message);
    },
  });

  const handleSave = () => {
    const trimmed = jobTitle.trim();
    if (!trimmed) {
      Alert.alert('Error', 'Please enter your job title.');
      return;
    }
    if (!hasChanges || mutation.isPending || isProfileLoading) return;
    mutation.mutate({ field: 'jobTitle', value: trimmed });
  };

  return (
    <View style={[modalStyles.container, { paddingBottom: insets.bottom || 16 }]}>
      <ModalDragHandle />
      <ModalHeader
        title="Job title"
        onClose={() => router.back()}
        onSave={handleSave}
        hasChanges={hasChanges && !!jobTitle.trim()}
        isPending={mutation.isPending || isProfileLoading}
      />

      {isProfileLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <View style={styles.content}>
          <Text style={styles.label}>What do you do for a living?</Text>
          <TextInput
            style={[styles.input, isFocused && styles.inputFocused]}
            placeholder="e.g. Content Creator, Software Engineer"
            placeholderTextColor={COLORS.textSecondary}
            value={jobTitle}
            onChangeText={setJobTitle}
            maxLength={50}
            returnKeyType="done"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            autoFocus
          />
          <Text style={styles.charCount}>{jobTitle.length}/50</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  label: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  input: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textPrimary,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  inputFocused: {
    borderColor: COLORS.inputBorderFocused,
    backgroundColor: COLORS.white,
  },
  charCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginTop: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});