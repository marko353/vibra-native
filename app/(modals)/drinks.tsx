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
  { value: 'Beer lover', emoji: '🍺', description: 'I enjoy different types of beer.' },
  { value: 'Wine enthusiast', emoji: '🍷', description: 'I prefer a good glass of wine.' },
  { value: 'Cocktail fan', emoji: '🍹', description: 'I love mixed drinks and experimenting.' },
  { value: 'Coffee only', emoji: '☕', description: 'Coffee is the only drink I need.' },
  { value: 'Non-alcoholic', emoji: '🧃', description: 'I mostly drink juices, teas, and water.' },
  { value: 'Open to anything', emoji: '🥂', description: 'I\'m open to all kinds of drinks.' },
  { value: 'I don\'t drink', emoji: '🚫', description: 'I don\'t consume alcohol at all.' },
];

export default function DrinksScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuthContext();
  const { setProfileField } = useProfileContext();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  const initial = typeof params.currentDrinks === 'string' ? params.currentDrinks : '';
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
      setProfileField('drinks', variables.value);
      queryClient.setQueryData(['userProfile', user?.id], (old: any) =>
        old ? { ...old, drinks: variables.value } : old
      );
      router.back();
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || error.message);
    },
  });

  const handleSave = () => {
    if (!selected || !hasChanges || mutation.isPending) return;
    mutation.mutate({ field: 'drinks', value: selected });
  };

  return (
    <View style={[modalStyles.container, { paddingBottom: insets.bottom || 16 }]}>
      <ModalDragHandle />
      <ModalHeader
        title="Drinks"
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