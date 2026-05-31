import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthContext } from '../../context/AuthContext';
import { useProfileContext } from '../../context/ProfileContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ModalDragHandle, ModalHeader, modalStyles } from '../../components/ModalTemplate';

const API_B = process.env.EXPO_PUBLIC_API_BASE_URL;

const COLORS = {
  primary: '#ff7f00',
  textPrimary: '#1a1a1a',
  textSecondary: '#999',
  textMuted: '#bbb',
  border: '#ECECEC',
  selectedBg: '#fff5ec',
  selectedBorder: '#ffd0a8',
  cardBg: '#fff',
  sectionBg: '#FAFAFA',
};

const interestsData = [
  {
    category: 'Social',
    icon: '🤝',
    tags: [
      'Volunteering', 'Education', 'Politics', 'Activism', 'Equality', 'Inclusion', 'Entertainment',
      'Podcasts', 'Social Media', 'Art', 'Culture', 'Career', 'Mentorship',
      'Networking', 'Critical Thinking', 'Philanthropy', 'Humanitarian Work',
      'Teamwork', 'Debates', 'Social Sciences',
    ],
  },
  {
    category: 'Food & Drinks',
    icon: '🍽️',
    tags: [
      'Foodie', 'Mocktails', 'Desserts', 'Sushi', 'Cooking Classes',
      'Vegan Cuisine', 'Coffee', 'Tea', 'Wine', 'Beer', 'Healthy Eating', 'Fast Food',
      'BBQ', 'Cooking', 'Bakery', 'Restaurants', 'Mixology', 'Home Cooking',
      'Exotic Food', 'Comfort Food',
    ],
  },
  {
    category: 'Going Out',
    icon: '🌆',
    tags: [
      'Nightlife', 'Bars', 'Museums', 'Theater', 'Cinema', 'Concerts',
      'Clubs', 'Festivals', 'Stand-up Comedy', 'Cafes', 'Pubs',
      'Karaoke', 'Dance Clubs', 'Group Outings', 'Spontaneous Plans',
      'Brunch', 'Restaurants', 'Art Galleries', 'Events', 'Parties',
    ],
  },
  {
    category: 'Creativity',
    icon: '🎨',
    tags: [
      'Photography', 'Fashion', 'Sneakers', 'Painting', 'Drawing', 'Design', 'Writing',
      'Ceramics', 'DIY Projects', 'Digital Art', 'Graphic Design', 'Poetry',
      'Sculpture', 'Architecture', 'Web Design', 'Video Production', 'Animation',
      'Tattoo Art', 'Calligraphy', 'Origami',
    ],
  },
  {
    category: 'Music',
    icon: '🎵',
    tags: [
      'Rock', 'Pop', 'Soul', 'Techno', 'Hip-hop', 'Classical', 'Jazz',
      'Blues', 'Electronic', 'Indie', 'Music Production', 'Punk',
      'Heavy Metal', 'R&B', 'Latin', 'Reggae', 'Country', 'Folk', 'EDM',
      'Acoustic',
    ],
  },
  {
    category: 'Staying In',
    icon: '🏠',
    tags: [
      'Netflix', 'Reading', 'Trivia', 'Online Shopping', 'Board Games',
      'Movies & Series', 'Gaming', 'Home Cooking', 'Home Organization',
      'Knitting/Crocheting', 'Cocktail Making', 'Relaxing', 'Meditation',
      'Listening to Music', 'Gardening', 'Cleaning', 'Journaling',
      'Learning New Skills', 'Writing',
    ],
  },
  {
    category: 'Nature & Adventure',
    icon: '🏔️',
    tags: [
      'Nature', 'Rowing', 'Hiking', 'Sailing', 'Snowboarding',
      'Camping', 'Rock Climbing', 'Diving', 'Cycling', 'Walking', 'Kayaking',
      'Hunting', 'Fishing', 'Exploring', 'Extreme Sports', 'Surfing', 'Skiing',
      'Horse Riding', 'Caving', 'Geocaching',
    ],
  },
  {
    category: 'Sport & Fitness',
    icon: '💪',
    tags: [
      'Athletics', 'Rugby', 'Running', 'Tennis', 'Basketball',
      'Swimming', 'Yoga', 'Gym', 'Football', 'Martial Arts', 'Dancing',
      'Gymnastics', 'Volleyball', 'CrossFit', 'Pilates', 'Trekking', 'Boxing',
      'Badminton',
    ],
  },
  {
    category: 'TV & Movies',
    icon: '🎬',
    tags: [
      'Action', 'Documentaries', 'Series', 'Reality TV', 'Anime', 'Horror', 'Comedy',
      'Drama', 'Thriller', 'Sci-Fi', 'Fantasy', 'Cartoons', 'Mystery',
      'Crime', 'Romance', 'Classic Films', 'Spy', 'Historical',
      'Western', 'Musical',
    ],
  },
  {
    category: 'Values & Goals',
    icon: '✨',
    tags: [
      'Mental Health', 'Feminism', 'Pride', 'Self-help', 'Personal Growth',
      'Spirituality', 'Minimalism', 'Sustainable Living', 'Health', 'Physical Wellness',
      'Therapy', 'Mindfulness', 'Philosophy', 'Political Views', 'Religion',
      'Animal Rights', 'Eco Awareness', 'Economics', 'Financial Literacy',
      'Freedom of Expression',
    ],
  },
  {
    category: 'Health & Wellness',
    icon: '🧘',
    tags: [
      'Skincare', 'Astrology', 'Awareness', 'Meditation', 'Nutrition',
      'Alternative Medicine', 'Strength Training', 'Flexibility', 'Yoga',
      'Pilates', 'Running', 'Walking', 'Quality Sleep', 'Hydration',
      'Breathing Exercises', 'Dietetics', 'Dermatology', 'Massage',
      'Psychotherapy', 'Wellness',
    ],
  },
];

const MAX_PER_CATEGORY = 5;
const MAX_TOTAL = 15;

interface MutationPayload { field: string; value: any; }

export default function InterestsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuthContext();
  const { setProfileField } = useProfileContext();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  const initialInterests: string[] = useMemo(() => {
    if (typeof params.currentInterests === 'string') {
      try {
        const parsed = JSON.parse(params.currentInterests);
        return Array.isArray(parsed) ? parsed.map(String) : [];
      } catch { return []; }
    }
    if (Array.isArray(params.currentInterests)) return params.currentInterests.map(String);
    return [];
  }, [params.currentInterests]);

  const [selectedTags, setSelectedTags] = useState<string[]>(initialInterests);

  const hasChanges = useMemo(() => {
    return JSON.stringify([...initialInterests].sort()) !== JSON.stringify([...selectedTags].sort());
  }, [initialInterests, selectedTags]);

  const mutation = useMutation({
    mutationFn: async (payload: MutationPayload) => {
      if (!user?.token) throw new Error("Token not available");
      const response = await axios.put(`${API_B}/api/user/update-profile`, payload, {
        headers: { Authorization: `Bearer ${user.token}`, 'Content-Type': 'application/json' },
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      setProfileField('interests', variables.value);
      queryClient.setQueryData(['userProfile', user?.id], (old: any) =>
        old ? { ...old, interests: variables.value } : old
      );
      router.back();
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || error.message);
    },
  });

  const toggleTag = (tag: string, category: string) => {
    if (mutation.isPending) return;
    setSelectedTags((prev) => {
      if (prev.includes(tag)) return prev.filter((t) => t !== tag);

      const categoryTags = interestsData.find(c => c.category === category)?.tags || [];
      const selectedInCategory = prev.filter(t => categoryTags.includes(t));

      if (selectedInCategory.length >= MAX_PER_CATEGORY) {
        Alert.alert('Limit reached', `You can select up to ${MAX_PER_CATEGORY} interests per category.`);
        return prev;
      }
      if (prev.length >= MAX_TOTAL) {
        Alert.alert('Limit reached', `You can select up to ${MAX_TOTAL} interests in total.`);
        return prev;
      }
      return [...prev, tag];
    });
  };

  const handleSave = () => {
    if (!hasChanges || mutation.isPending) return;
    mutation.mutate({ field: 'interests', value: selectedTags });
  };

  const renderCategory = ({ item }: { item: typeof interestsData[0] }) => {
    const selectedInCategory = selectedTags.filter(t => item.tags.includes(t)).length;
    const isCategoryFull = selectedInCategory >= MAX_PER_CATEGORY;

    return (
      <View style={styles.categorySection}>
        {/* Category header */}
        <View style={styles.categoryHeader}>
          <View style={styles.categoryTitleRow}>
            <Text style={styles.categoryIcon}>{item.icon}</Text>
            <Text style={styles.categoryTitle}>{item.category}</Text>
          </View>
          <View style={[styles.countBadge, isCategoryFull && styles.countBadgeFull]}>
            <Text style={[styles.countBadgeText, isCategoryFull && styles.countBadgeTextFull]}>
              {selectedInCategory}/{MAX_PER_CATEGORY}
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Tags */}
        <View style={styles.tagsContainer}>
          {item.tags.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <TouchableOpacity
                key={tag}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => toggleTag(tag, item.category)}
                disabled={mutation.isPending}
                activeOpacity={0.65}
              >
                {isSelected && (
                  <Ionicons
                    name="checkmark"
                    size={11}
                    color={COLORS.primary}
                    style={styles.chipCheckmark}
                  />
                )}
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={[modalStyles.container, { paddingBottom: insets.bottom || 16 }]}>
      <ModalDragHandle />
      <ModalHeader
        title="Interests"
        onClose={() => router.back()}
        onSave={handleSave}
        hasChanges={hasChanges}
        isPending={mutation.isPending}
      />

      {/* Counter bar */}
      <View style={styles.counterBar}>
        <Text style={styles.counterText}>
          <Text style={styles.counterNumber}>{selectedTags.length}</Text>
          <Text style={styles.counterTotal}>/{MAX_TOTAL} selected</Text>
        </Text>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${(selectedTags.length / MAX_TOTAL) * 100}%` },
            ]}
          />
        </View>
      </View>

      <FlatList
        data={interestsData}
        renderItem={renderCategory}
        keyExtractor={(item) => item.category}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  counterBar: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  counterText: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  counterNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  counterTotal: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '400',
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: '#F0F0F0',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 10,
  },
  categorySection: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingTop: 14,
    paddingBottom: 16,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 0.1,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  countBadgeFull: {
    backgroundColor: COLORS.selectedBg,
    borderColor: COLORS.selectedBorder,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  countBadgeTextFull: {
    color: COLORS.primary,
  },
  divider: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    backgroundColor: '#FAFAFA',
    gap: 4,
  },
  chipSelected: {
    borderColor: COLORS.selectedBorder,
    backgroundColor: COLORS.selectedBg,
  },
  chipCheckmark: {
    marginRight: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
    letterSpacing: 0.1,
  },
  chipTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});