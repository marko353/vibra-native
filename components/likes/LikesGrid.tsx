import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import LikeCard from './LikeCard';

interface LikesGridProps {
  data: {
    _id: string;
    fullName: string;
    birthDate: string;
    avatar: string;
  }[];
  isPremium: boolean;
  onLike: (id: string) => void;
  onSkip: (id: string) => void;
}

export default function LikesGrid({ data, onLike, onSkip }: LikesGridProps) {
  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item._id}
      numColumns={2}
      columnWrapperStyle={styles.row}
      renderItem={({ item }) => (
        <LikeCard
          user={item}
          onLike={() => onLike(item._id)}
          onSkip={() => onSkip(item._id)}
        />
      )}
      contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 20 }}
    />
  );
}

const styles = StyleSheet.create({
  row: { justifyContent: 'space-between', marginBottom: 16 },
});
