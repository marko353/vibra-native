import React, { useState, useMemo, useEffect } from 'react';
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
import { AntDesign } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthContext } from '../../context/AuthContext';
import { useProfileContext } from '../../context/ProfileContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const API_B = process.env.EXPO_PUBLIC_API_BASE_URL;

const COLORS = {
  primary: '#ff7f00',
  textPrimary: '#1a1a1a',
  textSecondary: '#999',
  textPlaceholder: '#C8C8C8',
  background: '#fff',
  border: '#ECECEC',
  selectedBg: '#fff5ec',
  selectedBorder: '#ffd0a8',
  iconBg: '#fff5ec',
  iconBorder: '#ffd0a8',
};

const OPTIONS = [
  { value: 'Casual and relaxed', emoji: '😊', description: 'Laid-back chats and easygoing conversations.' },
  { value: 'Intellectual and deep', emoji: '🧠', description: 'Deep discussions about ideas, art, and life.' },
  { value: 'Witty and playful', emoji: '😄', description: 'Full of jokes, humor, and fun exchanges.' },
  { value: 'Direct and honest', emoji: '🎯', description: 'Clear, straightforward communication with no beating around the bush.' },
  { value: 'Emotional and supportive', emoji: '💛', description: 'Focused on sharing feelings and offering support.' },
  { value: 'Organized and precise', emoji: '📋', description: 'Prefers planned, structured conversations.' },
];

export default function CommunicationStyleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuthContext();
  const { setProfileField } = useProfileContext();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  const initialStyle = typeof params.currentStyle === 'string' ? params.currentStyle : '';
  const [selected, setSelected] = useState(initialStyle);
  const hasChanges = selected !== initialStyle;

  useEffect(() => { setSelected(initialStyle); }, [initialStyle]);

  const mutation = useMutation({
    mutationFn: async (payload: { field: string; value: any }) => {
      if (!user?.token) throw new Error("Token not available");
      return await axios.put(`${API_B}/api/user/update-profile`, payload, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
    },
    onSuccess: (_, variables) => {
      setProfileField('communicationStyle', variables.value);
      queryClient.setQueryData(['userProfile', user?.id], (old: any) =>
        old ? { ...old, communicationStyle: variables.value } : old
      );
      router.back();
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || error.message);
    },
  });

  const handleSave = () => {
    if (!selected || !hasChanges || mutation.isPending) return;
    mutation.mutate({ field: 'communicationStyle', value: selected });
  };

  const renderItem = ({ item }: { item: typeof OPTIONS[0] }) => {
    const isSelected = item.value === selected;
    return (
      <TouchableOpacity
        style={[styles.option, isSelected && styles.optionSelected]}
        onPress={() => setSelected(item.value)}
        disabled={mutation.isPending}
        activeOpacity={0.7}
      >
        <View style={[styles.optionEmoji, isSelected && styles.optionEmojiSelected]}>
          <Text style={styles.emojiText}>{item.emoji}</Text>
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
    <View style={[styles.container, { paddingBottom: insets.bottom || 16 }]}>

      {/* Drag handle */}
      <View style={styles.dragHandle} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()} disabled={mutation.isPending}>
          <AntDesign name="close" size={20} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Communication style</Text>
        <TouchableOpacity
          style={[styles.saveBtn, hasChanges && selected && styles.saveBtnActive]}
          onPress={handleSave}
          disabled={!hasChanges || !selected || mutation.isPending}
          activeOpacity={0.8}
        >
          {mutation.isPending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={[styles.saveBtnText, hasChanges && selected && styles.saveBtnTextActive]}>
              Save
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Subtitle */}
      <Text style={styles.subtitle}>How do you prefer to communicate?</Text>

      {/* List */}
      <FlatList
        data={OPTIONS}
        renderItem={renderItem}
        keyExtractor={(item) => item.value}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 16,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
  },
  saveBtnActive: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPlaceholder,
  },
  saveBtnTextActive: {
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  list: {
    paddingBottom: 24,
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
  optionEmoji: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  optionEmojiSelected: {
    backgroundColor: COLORS.iconBg,
    borderWidth: 1,
    borderColor: COLORS.iconBorder,
  },
  emojiText: {
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
});