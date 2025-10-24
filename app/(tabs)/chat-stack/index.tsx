// ChatScreen.tsx

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthContext } from '../../../context/AuthContext';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../../../components/Header';
import { useSocketContext } from '../../../context/SocketContext';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const DEFAULT_AVATAR = 'https://placekitten.com/70/70';

// Tipovi
interface Match {
  _id: string;
  chatId: string;
  fullName: string;
  avatar: string;
  has_unread: boolean;
}

interface Conversation {
  chatId: string;
  user: {
    _id: string;
    fullName: string;
    avatar: string;
  };
  lastMessage: {
    text: string;
  };
  has_unread: boolean;
}

interface ApiData {
  newMatches: Match[];
  conversations: Conversation[];
}

export default function ChatScreen() {
  const { user } = useAuthContext();
  const router = useRouter();
  const queryClient = useQueryClient();
  const queryKey = ['my-matches', user?.id];
  const { socket } = useSocketContext();

  // 1️⃣ Dohvatanje podataka
  const { data, isLoading, isError, refetch } = useQuery<ApiData>({
    queryKey,
    queryFn: async () => {
      if (!user?.token) return { newMatches: [], conversations: [] };
      const response = await axios.get(`${API_BASE_URL}/api/user/my-matches`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      return response.data;
    },
    enabled: !!user?.token,
  });

  // 2️⃣ Refetch pri fokusu taba
  useFocusEffect(
    React.useCallback(() => {
      const hasData = queryClient.getQueryData(queryKey);
      if (!hasData) refetch();
      else queryClient.invalidateQueries({ queryKey });
    }, [queryClient, queryKey, refetch])
  );

  // 3️⃣ Socket događaji
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = () => queryClient.invalidateQueries({ queryKey });
    const handleUserDeleted = (deletedUserId: string) => queryClient.invalidateQueries({ queryKey });
    const handleNewMatch = () => queryClient.invalidateQueries({ queryKey });

    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('user_deleted', handleUserDeleted);
    socket.on('new_match', handleNewMatch);

    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('user_deleted', handleUserDeleted);
      socket.off('new_match', handleNewMatch);
    };
  }, [socket, queryClient, queryKey]);

  // 4️⃣ Mark as read mutacija (sigurna)
  const markAsReadMutation = useMutation({
    mutationFn: async (chatId: string) => {
      if (!user?.token) throw new Error('Korisnik nije autorizovan.');
      return axios.post(
        `${API_BASE_URL}/api/user/chat/${chatId}/mark-as-read`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
    },
    onMutate: async (chatId: string) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData<ApiData>(queryKey);
      if (previousData) {
        queryClient.setQueryData<ApiData>(queryKey, (old) => {
          if (!old) return previousData;
          return {
            newMatches: old.newMatches.map((m) =>
              m.chatId === chatId ? { ...m, has_unread: false } : m
            ),
            conversations: old.conversations.map((c) =>
              c.chatId === chatId ? { ...c, has_unread: false } : c
            ),
          };
        });
      }
      return { previousData };
    },
    onError: (err: any) => {
      // Uhvati 404 i ne loguj grešku
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        console.log('Preskočeno mark-as-read za nepostojeći chat.');
      } else {
        console.error('Greška pri mark-as-read:', err);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const { newMatches = [], conversations = [] } = data || {};

  // ✅ Siguran mark-as-read
  const markAsReadSafe = (chatId: string) => {
    const chatExists =
      conversations.some(c => c.chatId === chatId) ||
      newMatches.some(m => m.chatId === chatId);
    if (!chatExists) return; // preskoči ako chat ne postoji
    markAsReadMutation.mutate(chatId);
  };

  // 5️⃣ Otvaranje četa
  const handleOpenChat = (chatUser: any, chatId: string) => {
    markAsReadSafe(chatId);
    router.push({
      pathname: `/chat-stack/[chatId]`,
      params: {
        chatId,
        userName: chatUser.fullName,
        userAvatar: chatUser.avatar || DEFAULT_AVATAR,
        receiverId: chatUser._id,
      },
    });
  };

  // 6️⃣ Render
  return (
    <SafeAreaView style={styles.container}>
      <Header />
      {isLoading && !data ? (
        <ActivityIndicator style={styles.center} size="large" color="#FF6A00" />
      ) : isError ? (
        <View style={styles.center}>
          <Text>Došlo je do greške pri učitavanju.</Text>
        </View>
      ) : (
        <ScrollView refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}>
          {newMatches.length === 0 && conversations.length === 0 ? (
            <View style={styles.center}>
              <Text style={styles.emptyText}>Nemaš još nijedan spoj. Nastavi da prevlačiš!</Text>
            </View>
          ) : (
            <>
              {newMatches.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Novi spojevi</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.newMatchesContainer}
                  >
                    {newMatches.map((match) => (
                      <TouchableOpacity
                        key={match._id}
                        style={styles.matchItem}
                        onPress={() => handleOpenChat(match, match.chatId)}
                      >
                        <View style={styles.avatarContainer}>
                          <Image
                            source={{ uri: match.avatar || DEFAULT_AVATAR }}
                            style={styles.matchAvatar}
                          />
                          {match.has_unread && <View style={styles.notificationDot} />}
                        </View>
                        <Text style={styles.matchName} numberOfLines={1}>
                          {match.fullName}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Poruke</Text>
                {conversations.length === 0 ? (
                  <Text style={styles.emptyText}>Započni razgovor sa nekim od novih spojeva!</Text>
                ) : (
                  conversations.map((conv) => (
                    <TouchableOpacity
                      key={conv.chatId}
                      style={styles.conversationRow}
                      onPress={() => handleOpenChat(conv.user, conv.chatId)}
                    >
                      <View style={styles.avatarContainer}>
                        <Image
                          source={{ uri: conv.user.avatar || DEFAULT_AVATAR }}
                          style={styles.conversationAvatar}
                        />
                        {conv.has_unread && <View style={styles.notificationDot} />}
                      </View>
                      <View style={styles.conversationTextContainer}>
                        <Text style={styles.conversationName}>{conv.user.fullName}</Text>
                        <Text style={styles.lastMessage} numberOfLines={1}>
                          {conv.lastMessage?.text || '...'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// Styles ostaju isti
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, minHeight: 300 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', paddingHorizontal: 20, marginBottom: 15, color: '#222' },
  newMatchesContainer: { paddingLeft: 20, paddingRight: 10 },
  matchItem: { marginRight: 18, alignItems: 'center', width: 80 },
  avatarContainer: { position: 'relative', justifyContent: 'center', alignItems: 'center' },
  matchAvatar: { width: 72, height: 72, borderRadius: 36, borderWidth: 2, borderColor: '#FF6A00' },
  matchName: { marginTop: 8, fontSize: 13, fontWeight: '600', color: '#333', textAlign: 'center' },
  conversationRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 22 },
  conversationAvatar: { width: 60, height: 60, borderRadius: 30 },
  conversationTextContainer: { flex: 1, marginLeft: 15, justifyContent: 'center' },
  conversationName: { fontSize: 17, fontWeight: '700', color: '#111', marginBottom: 3 },
  lastMessage: { fontSize: 15, color: '#666' },
  emptyText: { paddingHorizontal: 20, color: '#999', fontSize: 15, textAlign: 'center', marginTop: 40 },
  notificationDot: {
    width: 18,
    height: 18,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    position: 'absolute',
    top: -2,
    right: -2,
    borderWidth: 2,
    borderColor: '#fff',
  },
});
