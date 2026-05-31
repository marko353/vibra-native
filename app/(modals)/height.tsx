import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  InteractionManager
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthContext } from '../../context/AuthContext';
import { useProfileContext } from '../../context/ProfileContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ModalDragHandle, ModalHeader, modalStyles } from '../../components/ModalTemplate';

const API_B = process.env.EXPO_PUBLIC_API_BASE_URL;

const { width } = Dimensions.get('window');
const RF = (size: number) => size * (width / 375);

const COLORS = {
  primary: '#ff7f00',
  textSecondary: '#999',
  background: '#fff',
  border: '#ECECEC',
};

const MIN_HEIGHT = 140;
const MAX_HEIGHT = 220;
const HEIGHT_DATA = Array.from({ length: MAX_HEIGHT - MIN_HEIGHT + 1 }, (_, i) => MIN_HEIGHT + i);
const ITEM_HEIGHT = RF(45);

interface MutationPayload { field: string; value: any; }

export default function HeightScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuthContext();
  const { setProfileField } = useProfileContext();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  const initialHeight: number = useMemo(() => {
    const heightParam = typeof params.currentHeight === 'string' ? parseInt(params.currentHeight) : null;
    return heightParam && !isNaN(heightParam) ? heightParam : 170;
  }, [params.currentHeight]);

  const [selectedHeight, setSelectedHeight] = useState(initialHeight);
  const flatListRef = useRef<FlatList>(null);

  const hasChanges = useMemo(() => selectedHeight !== initialHeight, [selectedHeight, initialHeight]);

  useEffect(() => {
    const initialIndex = HEIGHT_DATA.indexOf(initialHeight);
    if (initialIndex !== -1 && flatListRef.current) {
      InteractionManager.runAfterInteractions(() => {
        flatListRef.current?.scrollToOffset({
          offset: initialIndex * ITEM_HEIGHT,
          animated: false,
        });
      });
    }
  }, [initialHeight]);

  const mutation = useMutation({
    mutationFn: async (payload: MutationPayload) => {
      if (!user?.token) throw new Error("Token not available");
      const response = await axios.put(
        `${API_B}/api/user/update-profile`,
        payload,
        { headers: { Authorization: `Bearer ${user.token}`, 'Content-Type': 'application/json' } }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      setProfileField('height', variables.value);
      queryClient.setQueryData(['userProfile', user?.id], (old: any) =>
        old ? { ...old, height: variables.value } : old
      );
      router.back();
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || error.message);
    },
  });

  const handleSave = () => {
    if (!hasChanges || mutation.isPending) return;
    mutation.mutate({ field: 'height', value: selectedHeight });
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const yOffset = event.nativeEvent.contentOffset.y;
    const centerIndex = Math.round(yOffset / ITEM_HEIGHT);
    const limitedIndex = Math.max(0, Math.min(HEIGHT_DATA.length - 1, centerIndex));
    const newSelectedHeight = HEIGHT_DATA[limitedIndex];

    flatListRef.current?.scrollToOffset({
      offset: limitedIndex * ITEM_HEIGHT,
      animated: true,
    });

    if (newSelectedHeight && newSelectedHeight !== selectedHeight) {
      setSelectedHeight(newSelectedHeight);
    }
  };

  const renderItem = ({ item }: { item: number }) => {
    const isSelected = item === selectedHeight;
    return (
      <View style={styles.itemContainer}>
        <View style={[styles.itemContent, isSelected && styles.itemContentSelected]}>
          <Text style={[styles.itemText, isSelected && styles.itemTextSelected]}>
            {item}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[modalStyles.container, { paddingBottom: insets.bottom || 16 }]}>
      <ModalDragHandle />
      <ModalHeader
        title="Height"
        onClose={() => router.back()}
        onSave={handleSave}
        hasChanges={hasChanges}
        isPending={mutation.isPending}
      />

      <Text style={styles.subtitle}>Select your height in cm</Text>

      <View style={styles.pickerWrapper}>
        <FlatList
          ref={flatListRef}
          data={HEIGHT_DATA}
          renderItem={renderItem}
          keyExtractor={(item) => item.toString()}
          showsVerticalScrollIndicator={false}
          getItemLayout={(_, index) => ({
            length: ITEM_HEIGHT,
            offset: ITEM_HEIGHT * index,
            index,
          })}
          contentContainerStyle={styles.flatlistContent}
          onScrollToIndexFailed={info => {
            setTimeout(() => {
              flatListRef.current?.scrollToIndex({
                index: info.index,
                animated: true,
                viewPosition: 0.5,
              });
            }, 500);
          }}
          onMomentumScrollEnd={handleScrollEnd}
          decelerationRate="fast"
        />

        <View style={styles.unitContainer} pointerEvents="none">
          <Text style={styles.unitText}>cm</Text>
        </View>

        <LinearGradient
          colors={['#ffffff', 'rgba(255,255,255,0)']}
          style={styles.gradientTop}
          pointerEvents="none"
        />
        <LinearGradient
          colors={['rgba(255,255,255,0)', '#ffffff']}
          style={styles.gradientBottom}
          pointerEvents="none"
        />

        <View style={styles.selectionLineTop} />
        <View style={styles.selectionLineBottom} />
      </View>

      <Text style={styles.selectedLabel}>
        {selectedHeight} cm
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  pickerWrapper: {
    height: RF(250),
    marginHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
  },
  flatlistContent: {
    paddingVertical: RF(250 / 2) - ITEM_HEIGHT / 2,
    alignItems: 'center',
  },
  itemContainer: {
    height: ITEM_HEIGHT,
    width: width - 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  itemContentSelected: {
    backgroundColor: '#fff5ec',
  },
  itemText: {
    fontSize: RF(18),
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  itemTextSelected: {
    fontSize: RF(24),
    fontWeight: '700',
    color: COLORS.primary,
  },
  unitContainer: {
    position: 'absolute',
    right: 28,
    top: '50%',
    height: ITEM_HEIGHT,
    marginTop: -ITEM_HEIGHT / 2,
    justifyContent: 'center',
  },
  unitText: {
    fontSize: RF(18),
    color: COLORS.primary,
    fontWeight: '600',
  },
  selectionLineTop: {
    position: 'absolute',
    top: '50%',
    left: '12%',
    right: '12%',
    height: 1.5,
    backgroundColor: '#ffd0a8',
    marginTop: -ITEM_HEIGHT / 2,
  },
  selectionLineBottom: {
    position: 'absolute',
    top: '50%',
    left: '12%',
    right: '12%',
    height: 1.5,
    backgroundColor: '#ffd0a8',
    marginTop: ITEM_HEIGHT / 2,
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: RF(70),
  },
  gradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: RF(70),
  },
  selectedLabel: {
    marginTop: 20,
    fontSize: RF(28),
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
  },
});