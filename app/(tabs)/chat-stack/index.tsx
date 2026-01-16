import React, { useEffect, useMemo } from 'react';
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
import { useRouter, useFocusEffect, useNavigation } from 'expo-router';
import Header from '../../../components/Header';
import { useSocketContext } from '../../../context/SocketContext';
import { Ionicons } from '@expo/vector-icons';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const DEFAULT_AVATAR = 'https://placekitten.com/70/70';

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
  lastMessage?: {
    text: string;
    timestamp?: string;
  };
  has_unread: boolean;
}

interface ApiData {
  newMatches: Match[];
  conversations: Conversation[];
}

const formatTimestamp = (isoString?: string): string | null => {
  if (!isoString) return null;
  try {
    const date = new Date(isoString);
    const now = new Date();
    if (isNaN(date.getTime())) return null;

    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    const diffMinutes = Math.round(diffHours * 60);

    if (diffMinutes < 1) return 'Sad';
    if (diffMinutes < 60) return `${diffMinutes}m`;
    if (diffHours < 24 && date.getDate() === now.getDate()) {
      return date.toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' });
    } else if (diffHours < 48 && date.getDate() === now.getDate() - 1) {
      return 'Juče';
    } else {
      if (date.getFullYear() === now.getFullYear()) {
        return date.toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit' });
      } else {
        return date.toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit', year: '2-digit' });
      }
    }
  } catch {
    return null;
  }
};

export default function ChatScreen() {
  const { user } = useAuthContext();
  const router = useRouter();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => ['my-matches', user?.id], [user?.id]);
  const { socket } = useSocketContext();

  const { data, isLoading, isError, refetch, isRefetching } = useQuery<ApiData>({
    queryKey,
    queryFn: async () => {
      if (!user?.token) return { newMatches: [], conversations: [] };
      
      console.log('📡 [ChatScreen] POZIVAM API: /api/user/my-matches...');
      
      try {
        const response = await axios.get(`${API_BASE_URL}/api/user/my-matches`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });

        console.log('📦 [ChatScreen] SIROVI PODACI SA SERVERA:', JSON.stringify(response.data, null, 2));
        
        return response.data;
      } catch (err) {
        console.error('❌ [ChatScreen] API GREŠKA:', err);
        throw err;
      }
    },
    enabled: !!user?.token,
    staleTime: 0, // Postavljeno na 0 da bi invalidacija uvek radila pravi fetch
  });

  useFocusEffect(
    React.useCallback(() => {
      console.log('👀 [ChatScreen] Ekran u fokusu - osvežavam query...');
      queryClient.invalidateQueries({ queryKey });
      return () => {};
    }, [queryClient, queryKey])
  );

  // ✅ DODATI SOCKET LISTENERI
  useEffect(() => {
    if (!socket) return;
    
    console.log('🔌 [ChatScreen] Socket slušač inicijalizovan');
    
    const handleRefresh = (payload: any) => {
      console.log('⚡ [ChatScreen] Socket događaj primljen, osvežavam listu za 800ms:', payload);
      // Mala pauza osigurava da backend završi upis u DB pre nego što mi pitamo "ima li šta novo"
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey });
      }, 800);
    };
    
    socket.on('receiveMessage', handleRefresh);
    socket.on('user_deleted', handleRefresh);
    socket.on('new_match', handleRefresh);
    
    // Ključni dodatak: slušamo kada mi sami pošaljemo lajk koji rezultira mečom
    socket.on('likeSent', (data) => {
      console.log('❤️ [ChatScreen] Emitovan likeSent, pokrećem osvežavanje...');
      handleRefresh(data);
    });
    
    return () => {
      socket.off('receiveMessage', handleRefresh);
      socket.off('user_deleted', handleRefresh);
      socket.off('new_match', handleRefresh);
      socket.off('likeSent', handleRefresh);
    };
  }, [socket, queryClient, queryKey]);

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
      console.log('📝 [ChatScreen] Označavam kao pročitano:', chatId);
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
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const { newMatches = [], conversations = [] } = data || {};

  useEffect(() => {
    if (data) {
      console.log('📊 [ChatScreen] RENDER PROVERA:', {
        broj_novih_meceva: newMatches.length,
        broj_konverzacija: conversations.length,
        prvi_mec_u_listi: newMatches[0]?.fullName || 'Nema'
      });
    }
  }, [data, newMatches, conversations]);

  const handleOpenChat = (chatUser: Match | Conversation['user'], chatId: string) => {
    console.log('🚀 [ChatScreen] Otvaram chat:', { chatId, user: chatUser.fullName });
    
    const match = newMatches.find(m => m.chatId === chatId);
    const conv = conversations.find(c => c.chatId === chatId);
    if (match?.has_unread || conv?.has_unread) markAsReadMutation.mutate(chatId);

    router.push({
      pathname: `/(tabs)/chat-stack/[chatId]`,
      params: {
        chatId,
        userName: chatUser.fullName,
        userAvatar: chatUser.avatar || DEFAULT_AVATAR,
        receiverId: chatUser._id,
      },
    });
  };

  return (
    <View style={styles.container}> 
      <Header />
      {isLoading && !data ? (
        <ActivityIndicator style={styles.center} size="large" color="#FF6A00" />
      ) : isError ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={60} color="#ccc" />
          <Text style={styles.errorText}>Došlo je do greške pri učitavanju.</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Pokušaj ponovo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching && !isLoading}
              onRefresh={refetch}
              tintColor="#FF6A00"
              colors={['#FF6A00']}
            />
          }
        >
          {newMatches.length === 0 && conversations.length === 0 ? (
            <View style={styles.center}>
              <Ionicons name="chatbubbles-outline" size={80} color="#e0e0e0" style={{ marginBottom: 20 }}/>
              <Text style={styles.emptyTextTitle}>Tvoje poruke</Text>
              <Text style={styles.emptyText}>Kada se spojiš sa nekim ili dobiješ poruku, videćeš ih ovde.</Text>
            </View>
          ) : (
            <>
              {newMatches.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionTitleRow}>
                    <Text style={styles.sectionTitle}>Novi spojevi</Text>
                    {newMatches.some(m => m.has_unread) && (
                      <View style={styles.dotWithNumber}>
                        <Text style={styles.dotNumberText}>
                          {newMatches.filter(m => m.has_unread).length}
                        </Text>
                      </View>
                    )}
                  </View>

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
                        <View style={styles.matchAvatarWrapper}>
                          <Image
                            source={{ uri: match.avatar || DEFAULT_AVATAR }}
                            style={styles.matchAvatar}
                          />
                        </View>
                        {match.has_unread && <View style={styles.notificationDotMatch} />}
                        <Text style={styles.matchName} numberOfLines={1}>
                          {match.fullName}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              <View style={styles.sectionMessages}>
                <Text style={styles.sectionTitle}>Poruke</Text>
                {conversations.length === 0 && newMatches.length > 0 && (
                   <Text style={styles.noMessagesText}>Još uvek nemaš aktivnih razgovora.</Text>
                )}
                {conversations.map((conv, index) => (
                  <React.Fragment key={conv.chatId}>
                    <TouchableOpacity
                      style={styles.conversationRow}
                      onPress={() => handleOpenChat(conv.user, conv.chatId)}
                    >
                      <View style={styles.avatarContainer}>
                        <Image
                          source={{ uri: conv.user.avatar || DEFAULT_AVATAR }}
                          style={styles.conversationAvatar}
                        />
                        {conv.has_unread && <View style={styles.notificationDotConv} />}
                      </View>
                      <View style={styles.conversationTextContainer}>
                        <Text style={[styles.conversationName, conv.has_unread && styles.unreadText]} numberOfLines={1}>
                          {conv.user.fullName}
                        </Text>
                        <Text style={[styles.lastMessage, conv.has_unread && styles.unreadText]} numberOfLines={1}>
                          {conv.lastMessage?.text || 'Pošalji poruku...'}
                        </Text>
                      </View>
                      <Text style={[styles.timestamp, conv.has_unread && styles.unreadTimestamp]}>
                        {formatTimestamp(conv.lastMessage?.timestamp)}
                      </Text>
                    </TouchableOpacity>
                    {index < conversations.length - 1 && <View style={styles.separator} />}
                  </React.Fragment>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' }, 
  scrollContent: { paddingBottom: 100 },
  center: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 30, minHeight: 400 },
  errorText: { color: '#666', fontSize: 16, textAlign: 'center', marginTop: 10, marginBottom: 20 },
  retryButton: { backgroundColor: '#FF6A00', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20 },
  retryButtonText: { color: '#fff', fontWeight: 'bold' },
  section: { marginBottom: 15 },
  sectionMessages: { marginBottom: 0 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#111', marginLeft: 25 },
  newMatchesContainer: { paddingLeft: 15, paddingRight: 5, paddingBottom: 10 },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 15,
  },
  dotWithNumber: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  dotNumberText: { color: '#fff', fontWeight: '700', fontSize: 11 },
  matchItem: { marginRight: 6, alignItems: 'center', width: 78, position: 'relative' },
  matchAvatarWrapper: {
    width: 70, height: 90, borderRadius: 12, overflow: 'hidden',
    borderWidth: 1.5, borderColor: '#eee', backgroundColor: '#fff',
  },
  matchAvatar: { width: '100%', height: '100%' },
  matchName: { marginTop: 6, fontSize: 12, fontWeight: '500', color: '#444', textAlign: 'center' },
  notificationDotMatch: {
    width: 16, height: 16, backgroundColor: 'rgba(255, 59, 48, 1)', borderRadius: 8,
    position: 'absolute', top: 5, right: 5, borderWidth: 2.5, borderColor: '#fff', zIndex: 1,
  },
  conversationRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 12 },
  avatarContainer: { position: 'relative', marginRight: 12 },
  conversationAvatar: { width: 56, height: 56, borderRadius: 28 },
  conversationTextContainer: { flex: 1, justifyContent: 'center' },
  conversationName: { fontSize: 16, fontWeight: '600', color: '#111', marginBottom: 2 },
  lastMessage: { fontSize: 14, color: '#666' },
  timestamp: { fontSize: 12, color: '#999', marginLeft: 8 },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: '#e8e8e8', marginLeft: 85 },
  notificationDotConv: {
    width: 12, height: 12, backgroundColor: '#FF6A00', borderRadius: 6,
    position: 'absolute', bottom: 0, right: 0, borderWidth: 2, borderColor: '#fff',
  },
  unreadText: { fontWeight: '700', color: '#000' },
  unreadTimestamp: { color: '#FF6A00', fontWeight: '600' },
  emptyTextTitle: { fontSize: 22, fontWeight: '600', color: '#333', marginBottom: 8, textAlign: 'center' },
  emptyText: { paddingHorizontal: 20, color: '#888', fontSize: 15, textAlign: 'center' },
  noMessagesText: { marginLeft: 25, color: '#999', fontSize: 14, marginTop: 10 },
});