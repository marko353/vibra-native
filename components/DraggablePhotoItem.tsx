// components/DraggablePhotoItem.tsx

import React, { memo } from 'react';
import { StyleSheet, Dimensions, Image, TouchableOpacity, View, ActivityIndicator, Text, Alert } from 'react-native';
import { ScaleDecorator } from 'react-native-draggable-flatlist';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthContext } from '../context/AuthContext';

const { width } = Dimensions.get('window');
const SPACING = 10;
const ITEM_SIZE = (width - SPACING * 4) / 3;

const COLORS = {
    primary: '#E91E63',
    cardBackground: '#FFFFFF',
    placeholder: '#A0A0A0',
    border: '#E0E0E0',
    white: '#FFFFFF',
    textPrimary: '#1E1E1E',
};

// Pomocna funkcija za kompresiju niza
function compressImagesArray(images: (string | null)[]) {
    const filtered = images.filter((img) => img !== null);
    const nullsCount = images.length - filtered.length;
    return [...filtered, ...Array(nullsCount).fill(null)];
}

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

interface DraggablePhotoItemProps {
    item: { key: string; url: string | null };
    drag: () => void;
    isActive: boolean;
    mode: 'edit' | 'view';
    onAddImagePress: (index: number) => void;
    uploadingIndex: number | null;
}

const DraggablePhotoItem: React.FC<DraggablePhotoItemProps> = memo(({
    item,
    drag,
    isActive,
    mode,
    onAddImagePress,
    uploadingIndex,
}) => {
    const { user } = useAuthContext();
    const queryClient = useQueryClient();

    const animatedStyle = useAnimatedStyle(() => {
        const scale = isActive ? withTiming(1.05) : withTiming(1);
        const opacity = withTiming(isActive ? 0.9 : 1);
        return {
            transform: [{ scale }],
            opacity,
            zIndex: isActive ? 100 : 1,
        };
    }, [isActive]);

    const index = parseInt(item.key.split('-')[1], 10);

    // MUTACIJA ZA BRISANJE SLIKE JE SADA U OVOJ KOMPONENTI
    const deleteImageMutation = useMutation({
        mutationFn: async ({ index, imageUrl }: { index: number; imageUrl: string }) => {
            if (!user?.token) throw new Error("Token not available");
            const response = await axios.delete(`${API_BASE_URL}/api/user/delete-profile-picture`, {
                headers: { Authorization: `Bearer ${user.token}` },
                data: { imageUrl, position: index },
            });
            return response.data;
        },
        onSuccess: (data, variables) => {
            queryClient.setQueryData(['userProfilePhotos', user?.id], (oldData: (string | null)[] | undefined) => {
                const newData = oldData ? [...oldData] : Array(9).fill(null);
                newData[variables.index] = null;
                return compressImagesArray(newData);
            });
        },
        onError: (error) => {
            Alert.alert('Greška', 'Došlo je do greške prilikom brisanja slike sa servera.');
        },
    });

    const handleRemoveImage = () => {
        if (item.url) {
            deleteImageMutation.mutate({ index, imageUrl: item.url });
        }
    };

    if (item.url === null) {
        return (
            <View style={styles.cardContainer}>
                <TouchableOpacity
                    style={styles.placeholderCard}
                    onPress={() => onAddImagePress(index)}
                    disabled={mode === 'view' || uploadingIndex !== null}
                >
                    {uploadingIndex === index ? (
                        <ActivityIndicator size="small" color={COLORS.primary} />
                    ) : (
                        <>
                            <Ionicons name="add-circle-outline" size={40} color={COLORS.primary} />
                            <Text style={styles.addText}>Dodaj sliku</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScaleDecorator>
            <Animated.View style={[styles.card, animatedStyle]}>
                <TouchableOpacity
                    onLongPress={mode === 'edit' ? drag : undefined}
                    disabled={mode === 'view'}
                    style={StyleSheet.absoluteFillObject}
                >
                    <Image source={{ uri: item.url }} style={styles.image} />
                </TouchableOpacity>
                {mode === 'edit' && (
                    <TouchableOpacity
                        style={styles.removeBtn}
                        onPress={handleRemoveImage}
                    >
                        <Ionicons name="close-circle" size={24} color={COLORS.white} />
                    </TouchableOpacity>
                )}
            </Animated.View>
        </ScaleDecorator>
    );
});

DraggablePhotoItem.displayName = 'DraggablePhotoItem';

const styles = StyleSheet.create({
    cardContainer: {
        width: ITEM_SIZE,
        aspectRatio: 3 / 4,
        margin: SPACING / 2,
    },
    card: {
        width: ITEM_SIZE,
        aspectRatio: 3 / 4,
        borderRadius: 15,
        overflow: 'hidden',
        backgroundColor: COLORS.cardBackground,
        margin: SPACING / 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    placeholderCard: {
        flex: 1,
        backgroundColor: COLORS.cardBackground,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: COLORS.placeholder,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addText: {
        marginTop: 5,
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    removeBtn: {
        position: 'absolute',
        top: 5,
        right: 5,
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 20,
        padding: 2,
    },
});

export default DraggablePhotoItem;