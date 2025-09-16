// app/(modals)/height.tsx

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  InteractionManager
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthContext } from '../../context/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_B = process.env.EXPO_PUBLIC_API_BASE_URL;

const { width } = Dimensions.get('window');
const wp = (percentage: number) => (width * percentage) / 100;
const RF = (size: number) => size * (width / 375);

const COLORS = {
  primary: '#DC143C',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B7280',
  background: '#F8F8F8',
  cardBackground: '#FFFFFF',
  border: '#E0E0E0',
  white: '#FFFFFF',
  danger: '#DC3545',
  headerShadow: 'rgba(0, 0, 0, 0.08)',
};

const MIN_HEIGHT = 140;
const MAX_HEIGHT = 220;
const HEIGHT_DATA = Array.from({ length: MAX_HEIGHT - MIN_HEIGHT + 1 }, (_, i) => MIN_HEIGHT + i);
const ITEM_HEIGHT = RF(45);

export default function HeightScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

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
        const yOffset = initialIndex * ITEM_HEIGHT;
        flatListRef.current?.scrollToOffset({
          offset: yOffset,
          animated: false,
        });
      });
    }
  }, [initialHeight]);

  const updateProfileMutation = useMutation({
    mutationFn: async (payload: { field: string; value: any }) => {
      if (!user?.token) throw new Error("Token not available");
      const response = await axios.put(
        `${API_B}/api/user/update-profile`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['userProfile', user?.id], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          [variables.field]: variables.value,
        };
      });
      router.back();
    },
    onError: (error: any) => {
      console.error('Greška pri čuvanju visine:', error.response?.data || error.message);
      Alert.alert('Greška', `Došlo je do greške prilikom čuvanja visine: ${error.response?.data?.message || error.message}`);
    },
  });

  const handleSave = () => {
    if (!hasChanges || updateProfileMutation.isPending) return;
    updateProfileMutation.mutate({ field: 'height', value: selectedHeight });
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const yOffset = event.nativeEvent.contentOffset.y;
    const centerIndex = Math.round(yOffset / ITEM_HEIGHT);
    const newSelectedHeight = HEIGHT_DATA[centerIndex];
    if (newSelectedHeight && newSelectedHeight !== selectedHeight) {
      setSelectedHeight(newSelectedHeight);
    }
  };

  const renderItem = ({ item }: { item: number }) => {
    const isSelected = item === selectedHeight;
    return (
      <View style={styles.itemContainer}>
        <View style={[styles.itemContent, isSelected && styles.selectedItemContent]}>
          <Text style={[styles.itemText, isSelected && styles.selectedItemText]}>
            {item}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.cardBackground} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()} disabled={updateProfileMutation.isPending}>
          <Ionicons name="close-outline" size={RF(30)} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Uredi visinu</Text>

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          disabled={!hasChanges || updateProfileMutation.isPending}
        >
          {updateProfileMutation.isPending ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Text style={[
              styles.saveBtnText,
              { color: (!hasChanges) ? COLORS.textSecondary : COLORS.primary }
            ]}>
              Sačuvaj
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        <Text style={styles.label}>Odaberite svoju visinu u cm</Text>

        <View style={styles.pickerContainer}>
          <FlatList
            ref={flatListRef}
            data={HEIGHT_DATA}
            renderItem={renderItem}
            keyExtractor={(item) => item.toString()}
            showsVerticalScrollIndicator={false}
            getItemLayout={(data, index) => ({
              length: ITEM_HEIGHT,
              offset: ITEM_HEIGHT * index,
              index,
            })}
            onScrollToIndexFailed={info => {
              setTimeout(() => {
                flatListRef.current?.scrollToIndex({
                  index: info.index,
                  animated: true,
                  viewPosition: 0.5
                });
              }, 500);
            }}
            onMomentumScrollEnd={handleScrollEnd}
            snapToInterval={ITEM_HEIGHT}
            decelerationRate="fast"
            contentContainerStyle={styles.flatlistContent}
          />
          <View style={styles.unitTextContainer}>
            <Text style={styles.unitText}>cm</Text>
          </View>

          <LinearGradient
            colors={[COLORS.background, 'rgba(248, 248, 248, 0)']}
            style={styles.topGradient}
            pointerEvents="none"
          />
          <LinearGradient
            colors={['rgba(248, 248, 248, 0)', COLORS.background]}
            style={styles.bottomGradient}
            pointerEvents="none"
          />
          <View style={styles.selectionLineTop} />
          <View style={styles.selectionLineBottom} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: wp(2.5),
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + wp(2) : wp(2.5),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.cardBackground,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.headerShadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
      },
      android: {
        elevation: 6,
      },
    }),
    zIndex: 10,
  },
  closeBtn: { padding: wp(1.5) },
  saveBtn: { padding: wp(1.5) },
  saveBtnText: {
    fontSize: RF(16),
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: RF(18),
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: wp(2),
  },
  contentContainer: {
    flex: 1,
    padding: wp(5),
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: RF(16),
    color: COLORS.textSecondary,
    marginBottom: wp(5),
    fontWeight: '500',
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: RF(250),
    width: wp(80),
    maxWidth: 300,
    backgroundColor: COLORS.cardBackground,
    borderRadius: RF(15),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: RF(2) },
    shadowOpacity: 0.1,
    shadowRadius: RF(8),
    elevation: 5,
    overflow: 'hidden',
    position: 'relative',
  },
  flatlistContent: {
    paddingVertical: RF(100),
    alignItems: 'center',
  },
  itemContainer: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    width: wp(80),
  },
  itemContent: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    width: '100%',
    height: '100%',
  },
  selectedItemContent: {
    backgroundColor: 'rgba(220, 20, 60, 0.1)',
  },
  itemText: {
    fontSize: RF(18),
    lineHeight: RF(22),
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  selectedItemText: {
    fontSize: RF(24),
    lineHeight: RF(28),
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  unitTextContainer: {
    position: 'absolute',
    right: wp(8),
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'flex-start',
    top: '50%',
    marginTop: -ITEM_HEIGHT / 2,
    pointerEvents: 'none',
  },
  unitText: {
    fontSize: RF(14),
    lineHeight: RF(18),
    color: COLORS.primary,
    fontWeight: '600',
  },
  selectionLineTop: {
    position: 'absolute',
    top: '50%',
    left: '15%',
    right: '15%',
    height: RF(1.5),
    backgroundColor: COLORS.primary,
    marginTop: -ITEM_HEIGHT / 2,
  },
  selectionLineBottom: {
    position: 'absolute',
    top: '50%',
    left: '15%',
    right: '15%',
    height: RF(1.5),
    backgroundColor: COLORS.primary,
    marginTop: ITEM_HEIGHT / 2,
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: RF(60),
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: RF(60),
  },
});
