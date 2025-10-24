// [chatId].tsx — Verzija sa Empty State dodatim u postojeću strukturu

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Image,
  TouchableOpacity,
  Text,
  Modal,
  Keyboard, // Ostaje
  KeyboardAvoidingView, // Ostaje
} from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthContext } from '../../../context/AuthContext';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { io, Socket } from 'socket.io-client';
import {
  GiftedChat,
  IMessage,
  InputToolbar,
  Send,
  Bubble,
  type InputToolbarProps,
  type SendProps,
  type BubbleProps,
} from 'react-native-gifted-chat';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const DEFAULT_AVATAR = 'https://placekitten.com/120/120'; // Veći avatar za empty state

type BackendMessage = {
  _id: string; text: string; sender: string; createdAt: string; conversationId: string;
};
type CachedMessage = BackendMessage & { status?: 'sending' | 'error' | 'sent' };

export default function ChatScreen() {
  const params = useLocalSearchParams<{ chatId: string; receiverId: string; userName: string; userAvatar: string; }>();
  const { chatId, receiverId, userName, userAvatar } = params;
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const isUnmounted = useRef(false);

  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false); // Ostaje

  // Praćenje tastature (Ostaje)
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  const userId = useMemo(() => user?.id, [user?.id]);
  const meUser = useMemo(() => ({ _id: userId! }), [userId]);
  const otherUser = useMemo(() => ({ _id: receiverId, name: userName, avatar: userAvatar }), [receiverId, userName, userAvatar]);

  // Fetch poruka (Ostaje isto)
  const fetchMessages = async (): Promise<CachedMessage[]> => {
      if (!chatId || !user?.token) return [];
      const response = await axios.get(`${API_BASE_URL}/api/user/chat/${chatId}/messages`, {
          headers: { Authorization: `Bearer ${user.token}` },
      });
      return (response.data || []).map((msg: BackendMessage) => ({ ...msg, status: 'sent' }));
  };

  const queryKey = useMemo(() => ['chat', chatId], [chatId]);
  const { data: uiMessages = [], isLoading: isChatLoading } = useQuery<CachedMessage[], Error, IMessage[]>({
      queryKey: queryKey,
      queryFn: fetchMessages,
      enabled: !!chatId && !!user?.token && !!userId && !!receiverId,
      select: (data): IMessage[] =>
          data
              .map((msg) => ({
                  _id: msg._id,
                  text: msg.text,
                  createdAt: new Date(msg.createdAt),
                  user: msg.sender === userId ? meUser : otherUser,
                  pending: msg.status === 'sending',
              }))
              .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
      staleTime: 1000 * 60 * 5,
  });

  // markAsRead (Ostaje isto)
  const markAsReadMutation = useMutation({
      mutationFn: async () => {
          if (!user?.token || !chatId) throw new Error('Missing data for markAsRead.');
          return axios.post(`${API_BASE_URL}/api/user/chat/${chatId}/mark-as-read`, {}, { headers: { Authorization: `Bearer ${user.token}` } });
      },
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-matches', userId], exact: true }),
      onError: (err: Error | AxiosError) => {
          if (axios.isAxiosError(err) && err.response?.status === 404) {
              console.log('Chat (404) not found, ignoring markAsRead.');
          } else {
              console.error('❌ markAsRead error:', err);
          }
      },
  });

  // Socket.io (Ostaje isto)
  useEffect(() => {
      isUnmounted.current = false;
      if (!user?.token || !userId) return;
      const socket = io(API_BASE_URL!, { auth: { token: user.token } });
      socketRef.current = socket;
      socket.on('connect', () => console.log('✅ Connected'));
      socket.on('disconnect', () => console.log('🔴 Disconnected'));

      const handleReceiveMessage = (msg: BackendMessage) => {
          if (msg.conversationId === chatId) {
              console.log("📩 Received message, invalidating query:", queryKey);
              queryClient.invalidateQueries({ queryKey });
          }
      };
      socket.on('receiveMessage', handleReceiveMessage);

      return () => {
          isUnmounted.current = true;
          setTimeout(() => {
              if (isUnmounted.current && !markAsReadMutation.isPending) {
                 console.log("🧹 Unmounting, calling markAsRead");
                 markAsReadMutation.mutate();
              }
          }, 100);
          console.log("🔌 Disconnecting socket");
          socket.disconnect();
          socketRef.current = null;
      };
  }, [user?.token, userId, chatId, queryClient, queryKey, markAsReadMutation]);

  // Slanje poruka (Ostaje isto)
  const handleSend = useCallback((newMessages: IMessage[] = []) => {
      const messageToSend = newMessages[0];
      if (!messageToSend || !socketRef.current?.connected || !receiverId || !userId) return;
      const tempId = messageToSend._id;
      const optimisticMessage: CachedMessage = {
          _id: tempId.toString(), text: messageToSend.text, sender: userId,
          createdAt: new Date().toISOString(), conversationId: chatId!, status: 'sending',
      };
      queryClient.setQueryData<CachedMessage[]>(queryKey, (oldData = []) => [optimisticMessage, ...oldData]);
      socketRef.current.emit(
          'sendMessage', { receiverId, text: messageToSend.text },
          (response: { status: string; message: BackendMessage }) => {
              queryClient.setQueryData<CachedMessage[]>(queryKey, (oldData = []) =>
                  oldData.map(msg =>
                      msg._id === tempId.toString()
                          ? { ...response.message, status: response.status === 'ok' ? 'sent' : 'error' }
                          : msg
                  )
              );
          }
      );
  }, [receiverId, userId, chatId, queryClient, queryKey]);

  // Modal Actions (Ostaje isto)
  const handleBreakMatch = async () => {
      setIsMenuVisible(false);
      if (!user?.token || !chatId) { console.error("❌ Cannot break match: Missing token or chatId."); return; }
      try {
          console.log(`📡 Attempting DELETE: ${API_BASE_URL}/api/user/match/${chatId}`);
          await axios.delete(`${API_BASE_URL}/api/user/match/${chatId}`, { headers: { Authorization: `Bearer ${user.token}` } });
          console.log("✅ Match successfully deleted.");
          await queryClient.invalidateQueries({ queryKey: ['my-matches', user?.id], exact: true });
          queryClient.removeQueries({ queryKey: queryKey });
          console.log(`✅ Invalidated ['my-matches'] and removed query [${queryKey.join(', ')}].`);
          router.replace('/(tabs)/chat-stack');
      } catch (err) {
          console.error('❌ Error deleting match:', err);
      }
  };

  // Header
  const renderHeaderLeft = useCallback(() => (
    <TouchableOpacity onPress={() => router.replace('/(tabs)/chat-stack')} style={styles.headerButton}>
      <Ionicons name="arrow-back" size={24} color="#000" />
    </TouchableOpacity>
  ), []);

  const renderHeaderTitle = useCallback(() => (
    <View style={styles.headerTitleContainer}>
      <Image source={{ uri: userAvatar || 'https://placekitten.com/34/34' }} style={styles.avatar} />
      <Text numberOfLines={1} style={styles.headerName}>{userName || 'User'}</Text>
    </View>
  ), [userAvatar, userName]);

  const renderHeaderRight = useCallback(() => (
    <View style={styles.headerRightContainer}>
      <TouchableOpacity style={styles.headerButton}><Ionicons name="videocam-outline" size={24} color="#000" /></TouchableOpacity>
      <TouchableOpacity onPress={() => setIsMenuVisible(true)} style={styles.headerButton}>
        <Ionicons name="ellipsis-horizontal" size={24} color="#000" />
      </TouchableOpacity>
    </View>
  ), []);

  // GiftedChat render funkcije
  const renderInputToolbar = useCallback((props: InputToolbarProps<IMessage>) => (
    <InputToolbar {...props} containerStyle={styles.inputToolbarContainer} primaryStyle={styles.inputPrimaryStyle} />
  ), []);

  const renderSend = useCallback((props: SendProps<IMessage>) => (
    <Send {...props} containerStyle={styles.sendContainer}><Ionicons name="send" size={22} color="#FF6A00" /></Send>
  ), []);

  const renderBubble = useCallback((props: BubbleProps<IMessage>) => (
    <Bubble {...props} wrapperStyle={{
      right: { backgroundColor: '#FF6A00', borderRadius: 20, padding: 4 },
      left: { backgroundColor: '#EFEFEF', borderRadius: 20, padding: 4 },
    }} textStyle={{
      right: { color: 'white', fontSize: 15 },
      left: { color: 'black', fontSize: 15 },
    }} />
  ), []);

  const renderLoading = useCallback(() => (
    <View style={styles.loaderContainer}><ActivityIndicator size="large" color="#FF6A00" /></View>
  ), []);

  // Empty State
  const renderEmptyChat = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyTextMatch, styles.flippedText]}>Spojio/la si se sa korisnikom</Text>
      <Text style={[styles.emptyUserName, styles.flippedText]}>{userName || 'Korisnik'}</Text>
      <Image
        source={{ uri: userAvatar || DEFAULT_AVATAR }}
        style={[styles.emptyAvatar, styles.flippedImage]}
      />
      <Text style={[styles.emptyPrompt, styles.flippedText]}>Započni razgovor!</Text>
    </View>
  ), [userName, userAvatar]);

  return (
    <View style={styles.fullScreen}>
      <Stack.Screen
        options={{
          title: '', headerShadowVisible: false,
          headerLeft: renderHeaderLeft, headerTitleAlign: 'center',
          headerTitle: renderHeaderTitle, headerRight: renderHeaderRight,
        }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <View style={[styles.chatWrapper, !keyboardVisible && styles.chatWrapperRaised]}>
          {isChatLoading ? (
            renderLoading()
          ) : uiMessages.length === 0 ? (
            <View style={{ flex: 1 }}>
              {renderEmptyChat()}
              <GiftedChat
                messages={[]}
                onSend={handleSend}
                user={meUser}
                renderChatEmpty={() => null}
                renderMessage={() => <></>}
                renderInputToolbar={renderInputToolbar}
                renderSend={renderSend}
                alwaysShowSend
                minInputToolbarHeight={60}
              />
            </View>
          ) : (
            <GiftedChat
              messages={uiMessages}
              onSend={handleSend}
              user={meUser}
              placeholder="Type a message..."
              alwaysShowSend
              renderBubble={renderBubble}
              renderInputToolbar={renderInputToolbar}
              renderSend={renderSend}
              renderLoading={renderLoading}
              isLoadingEarlier={isChatLoading}
              messagesContainerStyle={styles.messagesContainer}
              showUserAvatar
            />
          )}
        </View>
      </KeyboardAvoidingView>

      <Modal visible={isMenuVisible} transparent animationType="fade" onRequestClose={() => setIsMenuVisible(false)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsMenuVisible(false)}>
              <View style={styles.actionSheetWrapper}>
                  <View style={styles.actionSheetGroup}>
                      <TouchableOpacity style={styles.menuItem} onPress={handleBreakMatch}>
                          <Text style={styles.menuTextDestructive}>Prekini spoj sa {userName}</Text>
                      </TouchableOpacity>
                      <View style={styles.separator} />
                      <TouchableOpacity style={styles.menuItem} onPress={() => { setIsMenuVisible(false); alert(`Prijavljujem korisnika: ${userName}`); }}>
                          <Text style={styles.menuText}>Prijavi korisnika {userName}</Text>
                      </TouchableOpacity>
                      <View style={styles.separator} />
                      <TouchableOpacity style={styles.menuItem} onPress={() => { setIsMenuVisible(false); alert(`Blokiram korisnika: ${userName}`); }}>
                          <Text style={styles.menuTextDestructive}>Blokiraj korisnika</Text>
                      </TouchableOpacity>
                  </View>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setIsMenuVisible(false)}>
                      <Text style={styles.cancelText}>Otkaži</Text>
                  </TouchableOpacity>
              </View>
          </TouchableOpacity>
      </Modal>
    </View>
  );
}

// Stilovi
const styles = StyleSheet.create({
  fullScreen: { flex: 1, backgroundColor: '#fff' },
  chatWrapper: { flex: 1 },
  chatWrapperRaised: { marginBottom: 28 },
  loaderContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.8)', zIndex: 1 },
  headerButton: { paddingHorizontal: 10 },
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 34, height: 34, borderRadius: 17, marginHorizontal: 10 },
  headerName: { fontSize: 18, fontWeight: '600' },
  headerRightContainer: { flexDirection: 'row' },
  messagesContainer: { paddingBottom: 10 },
  inputToolbarContainer: {
    borderTopWidth: 0, backgroundColor: '#f6f6f6', marginHorizontal: 8,
    borderRadius: 25, marginBottom: 12,
    paddingVertical: 4, paddingHorizontal: 8,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  inputPrimaryStyle: { alignItems: 'center' },
  sendContainer: { justifyContent: 'center', alignItems: 'center', height: 44, marginRight: 6 },
  emptyContainer: {
    flex: 1,
    alignItems: 'center', justifyContent: 'center', padding: 20,
    transform: [{ scaleY: -1 }],
    marginBottom: -15,
  },
  emptyTextMatch: { fontSize: 16, color: '#666', marginBottom: 5 },
  emptyUserName: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 25 },
  emptyAvatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 15 },
  emptyPrompt: { fontSize: 16, color: '#555', marginTop: 10 },
  flippedText: { transform: [{ scaleY: -1 }] },
  flippedImage: { transform: [{ scaleY: -1 }] },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', paddingHorizontal: 10, paddingBottom: Platform.OS === 'ios' ? 40 : 20 },
  actionSheetWrapper: { width: '100%' },
  actionSheetGroup: { backgroundColor: 'white', borderRadius: 12, overflow: 'hidden', marginBottom: 10 },
  menuItem: { paddingVertical: 16, alignItems: 'center' },
  menuText: { fontSize: 16, color: '#333' },
  menuTextDestructive: { fontSize: 16, color: '#FF3B30', fontWeight: '600' },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: '#E0E0E0' },
  cancelButton: { paddingVertical: 16, backgroundColor: 'white', borderRadius: 12, marginTop: 10, alignItems: 'center' },
  cancelText: { fontSize: 16, color: '#007AFF', fontWeight: '600' },
});
