import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuthContext } from '../context/AuthContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Carousel from 'react-native-reanimated-carousel';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

function compressImagesArray(images: (string | null)[]) {
  const filtered = images.filter((img) => img !== null);
  const nullsCount = images.length - filtered.length;
  return [...filtered, ...Array(nullsCount).fill(null)];
}

const windowWidth = Dimensions.get('window').width;

export default function EditProfileScreen() {
  const { user } = useAuthContext();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [mode, setMode] = useState<'edit' | 'view'>('edit');

  const { data: images = Array(9).fill(null), isLoading } = useQuery({
    queryKey: ['userProfilePhotos', user?.id],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/api/user/profile-pictures`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });

      const filledImages = Array(9).fill(null);
      if (Array.isArray(res.data.profilePictures)) {
        res.data.profilePictures.forEach((url: string, i: number) => {
          if (i < 9) filledImages[i] = url;
        });
      }

      return filledImages;
    },
    enabled: !!user?.token,
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ uri, index }: { uri: string; index: number }) => {
      const formData = new FormData();
      formData.append('profilePicture', {
        uri,
        name: `photo_${index}_${Date.now()}.jpg`,
        type: 'image/jpeg',
      } as any);

      const res = await axios.post(`${API_BASE_URL}/api/user/upload-profile-picture`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${user?.token}`,
        },
      });

      return { url: res.data.imageUrl || res.data.url, index };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['userProfilePhotos', user?.id], (oldData: (string | null)[] = []) => {
        const updated = [...oldData];
        updated[data.index] = data.url;
        return compressImagesArray(updated);
      });
    },
    onError: () => Alert.alert('Greška', 'Upload slike nije uspeo'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (imageUrl: string) => {
      await axios.post(
        `${API_BASE_URL}/api/user/remove-profile-picture`,
        { imageUrl },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
    },
    onSuccess: (_, imageUrl) => {
      queryClient.setQueryData(['userProfilePhotos', user?.id], (oldData: (string | null)[] = []) => {
        const newData = oldData.map((img) => (img === imageUrl ? null : img));
        return compressImagesArray(newData);
      });
    },
    onError: () => Alert.alert('Greška', 'Brisanje slike nije uspelo'),
  });

  const pickAndUploadImage = async (index: number) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Dozvola potrebna', 'Morate dozvoliti pristup galeriji.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      setUploadingIndex(index);
      uploadMutation.mutate(
        { uri, index },
        { onSettled: () => setUploadingIndex(null) }
      );
    }
  };

  const removeImage = (index: number) => {
    const imageUrl = images[index];
    if (!imageUrl) return;

    Alert.alert('Ukloni sliku', 'Da li ste sigurni da želite da uklonite ovu sliku?', [
      { text: 'Otkaži', style: 'cancel' },
      { text: 'Ukloni', onPress: () => deleteMutation.mutate(imageUrl) },
    ]);
  };

  const renderItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<string | null>) => {
      const index = images.findIndex((i) => i === item);
      const isUploading = uploadingIndex === index;

      return (
        <TouchableOpacity
          onLongPress={drag}
          style={[styles.card, { opacity: isActive ? 0.8 : 1 }]}
          disabled={isUploading}
        >
          {item ? (
            <>
              <Image source={{ uri: item }} style={styles.image} />
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => removeImage(index)}
                disabled={isUploading}
              >
                <Ionicons name="close" size={18} color="#fff" />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.placeholder}>
                {isUploading ? (
                  <ActivityIndicator size="large" color="#FF4081" />
                ) : (
                  <Text style={styles.plus}>+</Text>
                )}
              </View>
              {!isUploading && (
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => pickAndUploadImage(index)}
                >
                  <Ionicons name="add-circle" size={35} color="#ff2f06" />
                </TouchableOpacity>
              )}
            </>
          )}
        </TouchableOpacity>
      );
    },
    [images, uploadingIndex]
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF4081" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.fixedHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>

        <View style={styles.headerContentContainer}>
          <Text style={styles.title}>Uredi Profil</Text>

          <View style={styles.toggleButtons}>
            <TouchableOpacity onPress={() => setMode('edit')} style={styles.toggleBtn}>
              <Text style={[styles.toggleText, mode === 'edit' && styles.activeToggleText]}>
                Uredi
              </Text>
            </TouchableOpacity>

            <View style={styles.separator} />

            <TouchableOpacity onPress={() => setMode('view')} style={styles.toggleBtn}>
              <Text style={[styles.toggleText, mode === 'view' && styles.activeToggleText]}>
                Pregled
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.horizontalLine} />
      </View>

      <ScrollView
        style={styles.scrollableContent}
        contentContainerStyle={styles.scrollableContentContainer}
      >
        {mode === 'edit' ? (
          <DraggableFlatList
            data={images}
            keyExtractor={(_, index) => `image-${index}`}
            renderItem={renderItem}
            numColumns={3}
            onDragEnd={({ data }) => {
              const compressed = compressImagesArray(data);
              queryClient.setQueryData(['userProfilePhotos', user?.id], compressed);
              axios.post(
                `${API_BASE_URL}/api/user/update-profile-pictures-order`,
                { profilePictures: compressed.filter((img) => img !== null) },
                { headers: { Authorization: `Bearer ${user?.token}` } }
              ).catch(() => {
                Alert.alert('Greška', 'Nije uspelo sinhronizovanje redosleda slika sa serverom.');
              });
            }}
            contentContainerStyle={styles.grid}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.carouselContainer}>
            <Carousel
              loop
              width={windowWidth - 15}
              height={540}
              autoPlay={false}
              data={images.filter((img): img is string => img !== null)}
              renderItem={({ item }) => (
                <Image
                  source={{ uri: item }}
                  style={{ width: '100%', height: '100%', borderRadius: 20 }}
                />
              )}
              customConfig={() => ({ type: 'positive', setting: 'width' })}
              onProgressChange={(_, absoluteProgress) => {}}
              // renderPagination je izbačen
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  fixedHeader: {
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: '#fff',
    zIndex: 1,
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    justifyContent: 'flex-end',
  },
  headerContentContainer: {
    alignSelf: 'flex-start',
    marginLeft: 50,
    paddingBottom: 0,
  },
  backBtn: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#222',
    textAlign: 'left',
    marginBottom: 5,
    marginTop: 25,
  },
  toggleButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    top: -10,
  },
  toggleBtn: {
    paddingVertical: 12,
    paddingHorizontal: 25,
  },
  toggleText: {
    fontSize: 23,
    color: '#888',
    fontWeight: '700',
  },
  activeToggleText: {
    borderBottomWidth: 3,
    borderBottomColor: '#ff2f06',
  },
  separator: {
    width: 2,
    height: 28,
    backgroundColor: '#ccc',
    marginHorizontal: 15,
  },
  horizontalLine: {
    borderBottomColor: '#eee',
    borderBottomWidth: 2,
    marginHorizontal: -20,
    marginTop: 0,
    marginBottom: 0,
  },
  scrollableContent: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollableContentContainer: {
    padding: 20,
    paddingTop: 20,
    minHeight: '100%',
  },
  grid: {
    justifyContent: 'center',
    gap: 10,
  },
  card: {
    width: 110,
    height: 150,
    margin: 7,
    backgroundColor: '#fafafa',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plus: {
    fontSize: 36,
    color: '#ccc',
  },
  removeBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 2,
  },
  addBtn: {
    position: 'absolute',
    bottom: 1,
    right: 2,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 2,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  
  },
  paginationContainer: {
    flexDirection: 'row',
    position: 'absolute',
    top: 10,
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4081',
    marginHorizontal: 4,
    opacity: 0.5,
  },
});
