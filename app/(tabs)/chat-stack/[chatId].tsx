import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { router, Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Bubble,
  GiftedChat,
  IMessage,
  InputToolbar,
  Send,
  type BubbleProps,
  type InputToolbarProps,
  type SendProps,
} from "react-native-gifted-chat";
import { useAuthContext } from "../../../context/AuthContext";
import { useSocketContext } from "../../../context/SocketContext";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const DEFAULT_AVATAR = "https://placekitten.com/120/120";

const COLORS = {
  primary: "#ff7f00",
  primaryLight: "#fff5ec",
  primaryBorder: "#ffd0a8",
  background: "#F4F5F7",
  card: "#FFFFFF",
  textPrimary: "#1a1a1a",
  textSecondary: "#999",
  border: "#ECECEC",
};

type BackendMessage = {
  _id: string;
  text: string;
  sender: string;
  createdAt: string;
  conversationId: string;
};

type CachedMessage = BackendMessage & { status?: "sending" | "error" | "sent" };

const dedupe = <T extends { _id: string }>(arr: T[]) => {
  const map = new Map<string, T>();
  arr.forEach((m) => { if (!map.has(m._id)) map.set(m._id, m); });
  return [...map.values()];
};

export default function ChatDetailScreen() {
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
  const paramsReady = !!(chatId && receiverId);

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const hide = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  useEffect(() => {
    if (!chatId) return;
    AsyncStorage.setItem("currentChatId", chatId);
    return () => { AsyncStorage.removeItem("currentChatId"); };
  }, [chatId]);

  const userId = user?.id;
  const meUser = useMemo(() => ({ _id: userId! }), [userId]);
  const otherUser = useMemo(() => ({
    _id: receiverId || "",
    name: userName || "User",
    avatar: userAvatar || DEFAULT_AVATAR,
  }), [receiverId, userName, userAvatar]);

  const queryKey = ["chat", chatId];

  const { data: uiMessages = [], isLoading: isChatLoading } = useQuery<CachedMessage[], Error, IMessage[]>({
    queryKey,
    queryFn: async () => {
      if (!chatId || !user?.token) return [];
      const res = await axios.get(`${API_BASE_URL}/api/user/chat/${chatId}/messages`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      return dedupe((res.data || []).map((m: BackendMessage) => ({ ...m, status: "sent" as const })));
    },
    enabled: paramsReady && !!user?.token,
    select: (data) => dedupe(
      data.map((msg) => ({
        _id: msg._id,
        text: msg.text,
        createdAt: new Date(msg.createdAt),
        user: msg.sender === userId ? meUser : otherUser,
        pending: msg.status === "sending",
      })).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    ),
  });

  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user?.token || !chatId) return;
      await axios.post(`${API_BASE_URL}/api/user/chat/${chatId}/mark-as-read`, {}, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-matches", userId], exact: true });
    },
  });

  useFocusEffect(useCallback(() => {
    if (!paramsReady) return;
    setHasUnread(false);
    queryClient.refetchQueries({ queryKey });
    if (!markAsReadMutation.isPending && !markAsReadMutation.isSuccess) {
      markAsReadMutation.mutate();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsReady]));

  useEffect(() => {
    if (!socket) return;
    const handleReceive = (msg: BackendMessage) => {
      if (msg.conversationId !== chatId) {
        queryClient.invalidateQueries({ queryKey: ["my-matches", userId] });
        return;
      }
      markAsReadMutation.mutate();
      queryClient.setQueryData<CachedMessage[]>(["chat", chatId], (old = []) =>
        dedupe([{ ...msg, status: "sent" }, ...old.filter((m) => m._id !== msg._id)])
      );
    };
    socket.off("receiveMessage");
    socket.on("receiveMessage", handleReceive);
    return () => { socket.off("receiveMessage", handleReceive); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, chatId]);

  useEffect(() => {
    if (!paramsReady) return;
    if (!socket?.connected) socket?.connect();
    socket?.emit("join_chat", { chatId, userId });
    return () => { socket?.emit("leave_chat", { chatId, userId }); };
  }, [chatId, receiverId, socket, userId, paramsReady]);

  const handleSend = useCallback((newMessages: IMessage[] = []) => {
    const m = newMessages[0];
    if (!m || !socket?.connected || !receiverId || !userId) return;
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const optimistic: CachedMessage = {
      _id: tempId, text: m.text, sender: userId,
      createdAt: new Date().toISOString(), conversationId: chatId!, status: "sending",
    };
    queryClient.setQueryData<CachedMessage[]>(queryKey, (old = []) => dedupe([optimistic, ...old]));
    socket.emit("sendMessage", { receiverId, text: m.text },
      (response: { status: string; message: BackendMessage }) => {
        const final: CachedMessage = { ...response.message, status: response.status === "ok" ? "sent" : "error" };
        queryClient.setQueryData<CachedMessage[]>(queryKey, (old = []) => {
          let replaced = false;
          const updated = old.map((msg) => { if (msg._id === tempId && !replaced) { replaced = true; return final; } return msg; });
          return !replaced ? dedupe([final, ...old]) : dedupe(updated);
        });
        queryClient.invalidateQueries({ queryKey: ["my-matches", userId], exact: true });
      }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, receiverId, userId, chatId]);

  const handleBreakMatch = async () => {
    setIsMenuVisible(false);
    try {
      if (user?.token && chatId) {
        await axios.delete(`${API_BASE_URL}/api/user/match/${chatId}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
      }
    } catch {}
    await queryClient.invalidateQueries({ queryKey: ["my-matches", user?.id], exact: true });
    queryClient.removeQueries({ queryKey });
    router.replace("/(tabs)/chat-stack");
  };

  // ── RENDER HELPERS ──
  const renderHeaderLeft = () => (
    <TouchableOpacity onPress={() => router.replace("/(tabs)/chat-stack")} style={styles.headerBtn}>
      <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
    </TouchableOpacity>
  );

  const renderHeaderTitle = () => (
    <View style={styles.headerTitle}>
      <Image source={{ uri: userAvatar || DEFAULT_AVATAR }} style={styles.headerAvatar} />
      <View>
        <Text numberOfLines={1} style={styles.headerName}>{userName || "User"}</Text>
        <Text style={styles.headerOnline}>Online</Text>
      </View>
    </View>
  );

  const renderHeaderRight = () => (
    <View style={styles.headerRight}>
      <TouchableOpacity style={styles.headerBtn}>
        <Ionicons name="videocam-outline" size={22} color={COLORS.textPrimary} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setIsMenuVisible(true)} style={styles.headerBtn}>
        <Ionicons name="ellipsis-horizontal" size={22} color={COLORS.textPrimary} />
      </TouchableOpacity>
    </View>
  );

  const renderInputToolbar = (props: InputToolbarProps<IMessage>) => (
    <InputToolbar
      {...props}
      containerStyle={styles.inputToolbar}
      primaryStyle={styles.inputPrimary}
    />
  );

  const renderSend = (props: SendProps<IMessage>) => (
    <Send {...props} containerStyle={styles.sendContainer}>
      <View style={styles.sendBtn}>
        <Ionicons name="send" size={18} color="#fff" />
      </View>
    </Send>
  );

  const renderBubble = (props: BubbleProps<IMessage>) => (
    <Bubble
      {...props}
      wrapperStyle={{
        right: {
          backgroundColor: COLORS.primary,
          borderRadius: 20,
          borderBottomRightRadius: 4,
          padding: 2,
          shadowColor: COLORS.primary,
          shadowOpacity: 0.25,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: 3,
        },
        left: {
          backgroundColor: COLORS.card,
          borderRadius: 20,
          borderBottomLeftRadius: 4,
          padding: 2,
          borderWidth: 1,
          borderColor: COLORS.border,
        },
      }}
      textStyle={{
        right: { color: "#fff", fontSize: 15 },
        left: { color: COLORS.textPrimary, fontSize: 15 },
      }}
    />
  );

  const renderEmptyChat = () => (
    <View style={styles.emptyChat}>
      <View style={styles.emptyAvatarRing}>
        <Image source={{ uri: userAvatar || DEFAULT_AVATAR }} style={styles.emptyAvatar} />
      </View>
      <Text style={styles.emptyMatchedText}>You matched with</Text>
      <Text style={styles.emptyName}>{userName || "User"}</Text>
      <Text style={styles.emptyPrompt}>Say hello 👋</Text>
    </View>
  );

  if (!paramsReady) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Stack.Screen
        options={{
          title: "",
          headerShadowVisible: false,
          headerStyle: { backgroundColor: COLORS.card },
          headerLeft: renderHeaderLeft,
          headerTitleAlign: "left",
          headerTitle: renderHeaderTitle,
          headerRight: renderHeaderRight,
        }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <View style={[styles.chatWrapper, !keyboardVisible && styles.chatWrapperRaised]}>
          {isChatLoading ? (
            <View style={styles.loader}>
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
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
              messagesContainerStyle={styles.messagesContainer}
              inverted={true}
            />
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Action sheet menu */}
      <Modal visible={isMenuVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setIsMenuVisible(false)}
        >
          <View style={styles.actionSheet}>
            <View style={styles.actionGroup}>
              <TouchableOpacity style={styles.actionItem} onPress={handleBreakMatch}>
                <Ionicons name="heart-dislike-outline" size={18} color="#EF4444" />
                <Text style={styles.actionTextDestructive}>Unmatch {userName}</Text>
              </TouchableOpacity>
              <View style={styles.actionSep} />
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => { setIsMenuVisible(false); alert(`Reporting user: ${userName}`); }}
              >
                <Ionicons name="flag-outline" size={18} color={COLORS.textPrimary} />
                <Text style={styles.actionText}>Report {userName}</Text>
              </TouchableOpacity>
              <View style={styles.actionSep} />
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => { setIsMenuVisible(false); alert(`Blocking user: ${userName}`); }}
              >
                <Ionicons name="ban-outline" size={18} color="#EF4444" />
                <Text style={styles.actionTextDestructive}>Block user</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsMenuVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  chatWrapper: { flex: 1 },
  chatWrapperRaised: { marginBottom: 28 },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  messagesContainer: { paddingBottom: 10 },

  // Header
  headerBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  headerTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.primaryBorder,
  },
  headerName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },
  headerOnline: {
    fontSize: 11,
    color: "#10B981",
    fontWeight: "500",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },

  // Input toolbar
  inputToolbar: {
    borderTopWidth: 0,
    backgroundColor: COLORS.card,
    marginHorizontal: 12,
    borderRadius: 20,
    marginBottom: 20,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  inputPrimary: { alignItems: "center" },
  sendContainer: {
    justifyContent: "center",
    alignItems: "center",
    height: 44,
    marginRight: 4,
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },

  // Empty chat
  emptyChat: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 60,
    gap: 8,
  },
  emptyAvatarRing: {
    padding: 3,
    borderRadius: 46,
    borderWidth: 2,
    borderColor: COLORS.primaryBorder,
    marginBottom: 8,
  },
  emptyAvatar: {
    width: 88,
    height: 88,
    borderRadius: 40,
  },
  emptyMatchedText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  emptyName: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  emptyPrompt: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: 4,
  },

  // Action sheet
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
    paddingHorizontal: 12,
    paddingBottom: Platform.OS === "ios" ? 40 : 60,
  },
  actionSheet: { width: "100%" },
  actionGroup: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 30,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  actionText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: "500",
  },
  actionTextDestructive: {
    fontSize: 16,
    color: "#EF4444",
    fontWeight: "600",
  },
  actionSep: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
    marginLeft: 20,
  },
  cancelBtn: {
    paddingVertical: 16,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: "700",
  },
});