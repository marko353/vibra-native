import React from 'react';
import {
  FlatList,
  StyleSheet,
  View,
  ListRenderItem,
} from 'react-native';
import LikeCard from './LikeCard';

/* ================= TYPES ================= */

export interface LikeUser {
  _id: string;
  fullName: string;
  avatar: string | null;
  chatId: string;
  has_unread: boolean;
}

interface LikesGridProps {
  data: LikeUser[];
  isPremium: boolean;
}

/* ================= COMPONENT ================= */

const LikesGrid: React.FC<LikesGridProps> = ({ data, isPremium }) => {
  const renderItem: ListRenderItem<LikeUser> = ({ item }) => (
    <LikeCard user={item} isPremium={isPremium} />
  );

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item._id}
      renderItem={renderItem}
      numColumns={2}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.list}
      columnWrapperStyle={styles.row}
      ListFooterComponent={<View style={styles.footerSpace} />}
    />
  );
};

export default LikesGrid;

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  row: {
    justifyContent: 'space-between',
  },
  footerSpace: {
    height: 140,
  },
});
