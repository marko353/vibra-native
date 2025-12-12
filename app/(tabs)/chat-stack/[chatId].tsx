import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Image,
  TouchableOpacity,
  Text,
  Modal,
  Keyboard,
  KeyboardAvoidingView,
} from 'react-native';
import { Stack, useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthContext } from '../../../context/AuthContext';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
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
import { useSocketContext } from '../../../context/SocketContext';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const DEFAULT_AVATAR = 'https://placekitten.com/120/120';

type BackendMessage = {
  _id: string;
  text: string;
  sender: string;
  createdAt: string;
  conversationId: string;
};

type CachedMessage = BackendMessage & { status?: 'sending' | 'error' | 'sent' };

const debug = false;
const d = (...args: any[]) => debug && console.log(...args);

const dedupe = <T extends { _id: string }>(arr: T[]) => {
  const map = new Map<string, T>();
  arr.forEach((m) => {
    if (!map.has(m._id)) map.set(m._id, m);
  });
  return [...map.values()];
};

export default function ChatScreen() {
  const params = useLocalSearchParams<{
    chatId: string;
    receiverId: string;
    userName: string;
    userAvatar: string;
  }>();

  const { chatId, receiverId, userName, userAvatar } = params;
  const { user } = useAuthContext();
  const { socket, setHasUnread } = useSocketContext();
  const queryClient = useQueryClient();

  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const userId = user?.id;
  const meUser = useMemo(() => ({ _id: userId! }), [userId]);
  const otherUser = useMemo(
    () => ({ _id: receiverId, name: userName, avatar: userAvatar }),
    [receiverId, userName, userAvatar]
  );

  const fetchMessages = async (): Promise<CachedMessage[]> => {
    if (!chatId || !user?.token) return [];
    d('📥 Fetch messages...');
    const res = await axios.get(`${API_BASE_URL}/api/user/chat/${chatId}/messages`, {
      headers: { Authorization: `Bearer ${user.token}` },
    });
    const raw: BackendMessage[] = res.data || [];
    const mapped = raw.map((m) => ({ ...m, status: 'sent' as const }));
    return dedupe(mapped);
  };

  const queryKey = ['chat', chatId];

  const {
    data: uiMessages = [],
    isLoading: isChatLoading,
  } = useQuery<CachedMessage[], Error, IMessage[]>({
    queryKey,
    queryFn: fetchMessages,
    enabled: !!chatId && !!user?.token,

    select: (data) => {
      const mapped = data
        .map((msg) => ({
          _id: msg._id,
          text: msg.text,
          createdAt: new Date(msg.createdAt),
          user: msg.sender === userId ? meUser : otherUser,
          pending: msg.status === 'sending',
        }))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return dedupe(mapped);
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user?.token || !chatId) return;
      await axios.post(
        `${API_BASE_URL}/api/user/chat/${chatId}/mark-as-read`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-matches', userId], exact: true });
    },
  });

 useFocusEffect(
  useCallback(() => {
    console.log('👀 Ušao u chat → gasim badge');
    setHasUnread(false); // 🔥 OVO JE KLJUČNO

    queryClient.refetchQueries({ queryKey });

    if (!markAsReadMutation.isPending && !markAsReadMutation.isSuccess) {
      markAsReadMutation.mutate();
    }

    return () => {};
  }, [queryKey])
);

useEffect(() => {
  if (!socket) {
    console.log("🔌 useEffect[Socket]: socket nije inicijalizovan");
    return;
  }

  console.log("🔌 useEffect[Socket]: aktiviram listener za receiveMessage");

const handleReceive = (msg: BackendMessage) => {
  if (msg.conversationId !== chatId) {
    queryClient.invalidateQueries({ queryKey: ["my-matches", userId] });
    return;
  }

  // 🔥 REŠENJE: čim si u otvorenom chatu – odmah markiraj poruke kao pročitane
  markAsReadMutation.mutate();

  const incoming: CachedMessage = { ...msg, status: "sent" };

  queryClient.setQueryData<CachedMessage[]>(["chat", chatId], (old = []) => {
    const filtered = old.filter((m) => m._id !== incoming._id);
    return [incoming, ...filtered];
  });
  
  queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
};


  socket.on("receiveMessage", handleReceive);

  return () => {
    console.log("🔌 useEffect[Socket cleanup]: skidam listener receiveMessage");
    socket.off("receiveMessage", handleReceive);
  };
}, [socket, chatId, queryClient, userId]);


  const handleSend = useCallback(
    (newMessages: IMessage[] = []) => {
      const m = newMessages[0];
      if (!m || !socket?.connected || !receiverId || !userId) return;

      const tempId = `temp-${Date.now()}-${Math.random()}`;

      const optimistic: CachedMessage = {
        _id: tempId,
        text: m.text,
        sender: userId,
        createdAt: new Date().toISOString(),
        conversationId: chatId!,
        status: 'sending',
      };

      // optimistic insert
      queryClient.setQueryData<CachedMessage[]>(queryKey, (old = []) => {
        return dedupe([optimistic, ...old]);
      });

      socket.emit(
        'sendMessage',
        { receiverId, text: m.text },
        (response: { status: string; message: BackendMessage }) => {
          const final: CachedMessage = {
            ...response.message,
            status: response.status === 'ok' ? 'sent' : 'error',
          };

          queryClient.setQueryData<CachedMessage[]>(queryKey, (old = []) => {
            let replaced = false;

            const updated = old.map((msg) => {
              if (msg._id === tempId && !replaced) {
                replaced = true;
                return final;
              }
              return msg;
            });

            if (!replaced) {
              return dedupe([final, ...old]);
            }

            return dedupe(updated);
          });

          queryClient.invalidateQueries({ queryKey: ['my-matches', userId], exact: true });
        }
      );
    },
    [socket, receiverId, userId, chatId]
  );

  const handleBreakMatch = async () => {
    setIsMenuVisible(false);

    try {
      if (user?.token && chatId) {
        await axios.delete(`${API_BASE_URL}/api/user/match/${chatId}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
      }
    } catch (err) {}

    await queryClient.invalidateQueries({ queryKey: ['my-matches', user?.id], exact: true });
    queryClient.removeQueries({ queryKey });
    router.replace('/(tabs)/chat-stack');
  };

  const renderHeaderLeft = () => (
    <TouchableOpacity onPress={() => router.replace('/(tabs)/chat-stack')} style={styles.headerButton}>
      <Ionicons name="arrow-back" size={24} color="#000" />
    </TouchableOpacity>
  );

  const renderHeaderTitle = () => (
    <View style={styles.headerTitleContainer}>
      <Image source={{ uri: userAvatar || DEFAULT_AVATAR }} style={styles.avatar} />
      <Text numberOfLines={1} style={styles.headerName}>
        {userName || 'User'}
      </Text>
    </View>
  );

  const renderHeaderRight = () => (
    <View style={styles.headerRightContainer}>
      <TouchableOpacity style={styles.headerButton}>
        <Ionicons name="videocam-outline" size={24} color="#000" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setIsMenuVisible(true)} style={styles.headerButton}>
        <Ionicons name="ellipsis-horizontal" size={24} color="#000" />
      </TouchableOpacity>
    </View>
  );

  const renderInputToolbar = (props: InputToolbarProps<IMessage>) => (
    <InputToolbar
      {...props}
      containerStyle={styles.inputToolbarContainer}
      primaryStyle={styles.inputPrimaryStyle}
    />
  );

  const renderSend = (props: SendProps<IMessage>) => (
    <Send {...props} containerStyle={styles.sendContainer}>
      <Ionicons name="send" size={22} color="#FF6A00" />
    </Send>
  );

  const renderBubble = (props: BubbleProps<IMessage>) => (
    <Bubble
      {...props}
      wrapperStyle={{
        right: { backgroundColor: '#FF6A00', borderRadius: 20, padding: 4 },
        left: { backgroundColor: '#EFEFEF', borderRadius: 20, padding: 4 },
      }}
      textStyle={{
        right: { color: 'white', fontSize: 15 },
        left: { color: 'black', fontSize: 15 },
      }}
    />
  );

  const renderLoading = () => (
    <View style={styles.loaderContainer}>
      <ActivityIndicator size="large" color="#FF6A00" />
    </View>
  );

  const renderEmptyChat = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTextMatch}>Spojio/la si se sa korisnikom</Text>
      <Text style={styles.emptyUserName}>{userName || 'Korisnik'}</Text>
      <Image source={{ uri: userAvatar || DEFAULT_AVATAR }} style={styles.emptyAvatar} />
      <Text style={styles.emptyPrompt}>Započni razgovor!</Text>
    </View>
  );

  return (
    <View style={styles.fullScreen}>
      <Stack.Screen
        options={{
          title: '',
          headerShadowVisible: false,
          headerLeft: renderHeaderLeft,
          headerTitleAlign: 'center',
          headerTitle: renderHeaderTitle,
          headerRight: renderHeaderRight,
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
                inverted={false}
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
              messagesContainerStyle={styles.messagesContainer}
              inverted={true}
            />
          )}
        </View>
      </KeyboardAvoidingView>

      {/* MENU */}
      <Modal visible={isMenuVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsMenuVisible(false)}
        >
          <View style={styles.actionSheetWrapper}>
            <View style={styles.actionSheetGroup}>
              <TouchableOpacity style={styles.menuItem} onPress={handleBreakMatch}>
                <Text style={styles.menuTextDestructive}>Prekini spoj sa {userName}</Text>
              </TouchableOpacity>

              <View style={styles.separator} />

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setIsMenuVisible(false);
                  alert(`Prijavljujem korisnika: ${userName}`);
                }}
              >
                <Text style={styles.menuText}>Prijavi korisnika {userName}</Text>
              </TouchableOpacity>

              <View style={styles.separator} />

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setIsMenuVisible(false);
                  alert(`Blokiram korisnika: ${userName}`);
                }}
              >
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

const styles = StyleSheet.create({
  fullScreen: { flex: 1, backgroundColor: '#fff' },
  chatWrapper: { flex: 1 },
  chatWrapperRaised: { marginBottom: 28 },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    zIndex: 1,
  },

  headerButton: { paddingHorizontal: 10 },
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center', marginRight: 70 },
  avatar: { width: 34, height: 34, borderRadius: 17, marginHorizontal: 10 },
  headerName: { fontSize: 18, fontWeight: '600' },
  headerRightContainer: { flexDirection: 'row' },

  messagesContainer: { paddingBottom: 10 },

  inputToolbarContainer: {
    borderTopWidth: 0,
    backgroundColor: '#f6f6f6',
    marginHorizontal: 8,
    borderRadius: 25,
    marginBottom: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    elevation: 3,
  },
  inputPrimaryStyle: { alignItems: 'center' },

  sendContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 44,
    marginRight: 6,
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginBottom: -70,
  },
  emptyTextMatch: { fontSize: 16, color: '#666', marginBottom: 5 },
  emptyUserName: { fontSize: 20, fontWeight: 'bold', marginBottom: 25 },
  emptyAvatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 15 },
  emptyPrompt: { fontSize: 16, color: '#555' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    paddingHorizontal: 10,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },

  actionSheetWrapper: { width: '100%' },
  actionSheetGroup: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
  },

  menuItem: { paddingVertical: 16, alignItems: 'center' },
  menuText: { fontSize: 16, color: '#333' },
  menuTextDestructive: { fontSize: 16, color: '#FF3B30', fontWeight: '600' },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: '#E0E0E0' },

  cancelButton: {
    paddingVertical: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelText: { fontSize: 16, color: '#007AFF', fontWeight: '600' },
});
