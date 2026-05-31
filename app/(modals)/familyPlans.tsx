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
  { value: 'Want children', emoji: '👶', description: 'I clearly want to have children in the future.' },
  { value: 'Don\'t want children', emoji: '🚫', description: 'I\'ve decided I don\'t want children.' },
  { value: 'Not sure', emoji: '🤔', description: 'I haven\'t made up my mind yet.' },
  { value: 'Have children', emoji: '👨‍👧', description: 'I already have children.' },
];

export default function FamilyPlansScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuthContext();
  const { setProfileField } = useProfileContext();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  const initial = typeof params.currentFamilyPlans === 'string' ? params.currentFamilyPlans : '';
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
      setProfileField('familyPlans', variables.value);
      queryClient.setQueryData(['userProfile', user?.id], (old: any) =>
        old ? { ...old, familyPlans: variables.value } : old
      );
      router.back();
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || error.message);
    },
  });

  const handleSave = () => {
    if (!selected || !hasChanges || mutation.isPending) return;
    mutation.mutate({ field: 'familyPlans', value: selected });
  };

  return (
    <View style={[modalStyles.container, { paddingBottom: insets.bottom || 16 }]}>
      <ModalDragHandle />
      <ModalHeader
        title="Family plans"
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