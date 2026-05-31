import React, { useState, useEffect } from 'react';
import { View, Alert, FlatList } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthContext } from '../../context/AuthContext';
import { useProfileContext } from '../../context/ProfileContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ModalDragHandle, ModalHeader, OptionItem, modalStyles } from '../../components/ModalTemplate';

const API_B = process.env.EXPO_PUBLIC_API_BASE_URL;

const OPTIONS = [
  { value: 'High school', emoji: '🏫', description: 'Completed high school education.' },
  { value: 'Associate degree', emoji: '🎓', description: 'Completed a two-year degree program.' },
  { value: 'Bachelor\'s degree', emoji: '📚', description: 'Completed undergraduate studies.' },
  { value: 'Master\'s degree', emoji: '🎓', description: 'Completed postgraduate studies.' },
  { value: 'PhD', emoji: '🔬', description: 'Earned a doctoral degree.' },
  { value: 'Prefer not to say', emoji: '🤷', description: 'I prefer not to specify my education.' },
];

export default function EducationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuthContext();
  const { setProfileField } = useProfileContext();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  const initial = typeof params.currentEducation === 'string'
    ? (() => { try { const p = JSON.parse(params.currentEducation); return Array.isArray(p) ? p[0] || '' : ''; } catch { return ''; } })()
    : '';

  const [selected, setSelected] = useState(initial);
  const hasChanges = selected !== initial;

  useEffect(() => { setSelected(initial); }, [initial]);

  const mutation = useMutation({
    mutationFn: async (payload: { field: string; value: any }) => {
      if (!user?.token) throw new Error("Token not available");
      return await axios.put(`${API_B}/api/user/update-profile`, payload, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
    },
    onSuccess: (_, variables) => {
      setProfileField('education', variables.value);
      queryClient.setQueryData(['userProfile', user?.id], (old: any) =>
        old ? { ...old, education: variables.value } : old
      );
      router.back();
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || error.message);
    },
  });

  const handleSave = () => {
    if (!selected || !hasChanges || mutation.isPending) return;
    mutation.mutate({ field: 'education', value: [selected] });
  };

  return (
    <View style={[modalStyles.container, { paddingBottom: insets.bottom || 16 }]}>
      <ModalDragHandle />
      <ModalHeader
        title="Education"
        onClose={() => router.back()}
        onSave={handleSave}
        hasChanges={hasChanges && !!selected}
        isPending={mutation.isPending}
      />
      <FlatList
        data={OPTIONS}
        keyExtractor={(item) => item.value}
        contentContainerStyle={modalStyles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <OptionItem
            emoji={item.emoji}
            title={item.value}
            description={item.description}
            isSelected={item.value === selected}
            onPress={() => setSelected(item.value)}
            disabled={mutation.isPending}
          />
        )}
      />
    </View>
  );
}