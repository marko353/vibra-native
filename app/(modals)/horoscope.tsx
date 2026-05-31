import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuthContext } from '../../context/AuthContext';
import { useProfileContext } from '../../context/ProfileContext';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ModalDragHandle, ModalHeader, modalStyles } from '../../components/ModalTemplate';

const API_B = process.env.EXPO_PUBLIC_API_BASE_URL;
const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#ff7f00',
  textPrimary: '#1a1a1a',
  textSecondary: '#999',
  textMuted: '#bbb',
  border: '#F0F0F0',
  selectedBg: '#fff5ec',
  selectedBorder: '#ffd0a8',
  iconColor: '#ddd',
};

const horoscopeOptions = [
  { value: 'Aries',       icon: 'zodiac-aries',       dates: 'Mar 21 – Apr 19', element: 'Fire' },
  { value: 'Taurus',      icon: 'zodiac-taurus',      dates: 'Apr 20 – May 20', element: 'Earth' },
  { value: 'Gemini',      icon: 'zodiac-gemini',      dates: 'May 21 – Jun 20', element: 'Air' },
  { value: 'Cancer',      icon: 'zodiac-cancer',      dates: 'Jun 21 – Jul 22', element: 'Water' },
  { value: 'Leo',         icon: 'zodiac-leo',         dates: 'Jul 23 – Aug 22', element: 'Fire' },
  { value: 'Virgo',       icon: 'zodiac-virgo',       dates: 'Aug 23 – Sep 22', element: 'Earth' },
  { value: 'Libra',       icon: 'zodiac-libra',       dates: 'Sep 23 – Oct 22', element: 'Air' },
  { value: 'Scorpio',     icon: 'zodiac-scorpio',     dates: 'Oct 23 – Nov 21', element: 'Water' },
  { value: 'Sagittarius', icon: 'zodiac-sagittarius', dates: 'Nov 22 – Dec 21', element: 'Fire' },
  { value: 'Capricorn',   icon: 'zodiac-capricorn',   dates: 'Dec 22 – Jan 19', element: 'Earth' },
  { value: 'Aquarius',    icon: 'zodiac-aquarius',    dates: 'Jan 20 – Feb 18', element: 'Air' },
  { value: 'Pisces',      icon: 'zodiac-pisces',      dates: 'Feb 19 – Mar 20', element: 'Water' },
];

const ELEMENT_COLORS: Record<string, string> = {
  Fire:  '#ff6b35',
  Earth: '#7cb87a',
  Air:   '#74b3ce',
  Water: '#6b8cff',
};

interface MutationPayload { field: string; value: any; }
interface UserProfile { horoscope: string | null; [key: string]: any; }

export default function HoroscopeScreen() {
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

  const [selected, setSelected] = useState<string>('');

  useFocusEffect(
    useCallback(() => {
      if (user?.token) refetch();
    }, [user, refetch])
  );

  useEffect(() => {
    if (userProfile?.horoscope) setSelected(userProfile.horoscope);
  }, [userProfile]);

  const hasChanges = useMemo(() => selected !== userProfile?.horoscope, [selected, userProfile]);

  const mutation = useMutation({
    mutationFn: async (payload: MutationPayload) => {
      if (!user?.token) throw new Error("Token not available");
      const response = await axios.put(`${API_B}/api/user/update-profile`, payload, {
        headers: { Authorization: `Bearer ${user.token}`, 'Content-Type': 'application/json' },
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      setProfileField('horoscope', variables.value);
      queryClient.setQueryData(['userProfile', user?.id], (old: any) =>
        old ? { ...old, horoscope: variables.value } : old
      );
      router.back();
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || error.message);
    },
  });

  const handleSave = () => {
    if (!selected || !hasChanges || mutation.isPending || isProfileLoading) return;
    mutation.mutate({ field: 'horoscope', value: selected });
  };

  const renderItem = ({ item }: { item: typeof horoscopeOptions[0] }) => {
    const isSelected = item.value === selected;
    const elementColor = ELEMENT_COLORS[item.element];

    return (
      <TouchableOpacity
        style={[styles.option, isSelected && styles.optionSelected]}
        onPress={() => setSelected(item.value)}
        disabled={mutation.isPending || isProfileLoading}
        activeOpacity={0.7}
      >
        {/* Icon */}
        <View style={[styles.iconBox, isSelected && styles.iconBoxSelected]}>
        <MaterialCommunityIcons
        name={item.icon as any}
        size={20}
        color={isSelected ? COLORS.primary : COLORS.iconColor}
      />
        </View>

        {/* Text */}
        <View style={styles.optionContent}>
          <Text style={[styles.optionTitle, isSelected && styles.optionTitleSelected]}>
            {item.value}
          </Text>
          <Text style={styles.optionDates}>{item.dates}</Text>
        </View>

        {/* Element badge */}
        <View style={[styles.elementBadge, { backgroundColor: elementColor + '18' }]}>
          <Text style={[styles.elementText, { color: elementColor }]}>
            {item.element}
          </Text>
        </View>

        {/* Checkmark */}
        {isSelected && (
          <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} style={{ marginLeft: 6 }} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[modalStyles.container, { paddingBottom: insets.bottom || 16 }]}>
      <ModalDragHandle />
      <ModalHeader
        title="Horoscope"
        onClose={() => router.back()}
        onSave={handleSave}
        hasChanges={hasChanges && !!selected}
        isPending={mutation.isPending || isProfileLoading}
      />

      <Text style={styles.subtitle}>What&apos;s your star sign?</Text>

      {isProfileLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
       <FlatList
  key="horoscope-list"
  data={horoscopeOptions}
  renderItem={renderItem}
  keyExtractor={(item) => item.value}
  contentContainerStyle={modalStyles.list}
  showsVerticalScrollIndicator={false}
/>
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
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: '#fff',
    marginBottom: 8,
    gap: 12,
  },
  optionSelected: {
    borderColor: COLORS.selectedBorder,
    backgroundColor: COLORS.selectedBg,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F7F7F7',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconBoxSelected: {
    backgroundColor: COLORS.selectedBg,
    borderWidth: 1,
    borderColor: COLORS.selectedBorder,
  },
  optionContent: {
    flex: 1,
    gap: 2,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  optionTitleSelected: {
    color: COLORS.primary,
  },
  optionDates: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  elementBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  elementText: {
    fontSize: 11,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});