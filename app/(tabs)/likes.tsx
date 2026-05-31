import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Modal, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFilterModal } from "../../context/FilterModalContext";

import Header from "../../components/Header";
import LikesCTA from "../../components/likes/LikesCTA";
import LikesGrid from "../../components/likes/LikesGrid";
import MatchAnimation from "../../components/MatchAnimation";
import { useAuthContext } from "../../context/AuthContext";
import { useSocketContext } from "../../context/SocketContext";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

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

export default function LikesTab() {
  const { user } = useAuthContext();
  const { socket } = useSocketContext();
  const queryClient = useQueryClient();

  const [isProcessing, setIsProcessing] = useState(false);
  const [matchData, setMatchData] = useState<any>(null);
  const { showModal } = useFilterModal();

  const [toastMessage, setToastMessage] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const {
    data: likes = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["incoming-likes", user?.id],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/api/user/incoming-likes`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      return res.data?.likes || res.data || [];
    },
    enabled: !!user?.token && !!user?.id,
  });

  useEffect(() => {
    if (!socket) return;
    const handleSocketEvent = (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["incoming-likes", user?.id] });
      refetch();
    };
    socket.on("likeReceived", handleSocketEvent);
    socket.on("newIncomingLike", handleSocketEvent);
    return () => {
      socket.off("likeReceived", handleSocketEvent);
      socket.off("newIncomingLike", handleSocketEvent);
    };
  }, [socket, user?.id, queryClient, refetch]);

  const handleSkip = useCallback(
    async (targetUserId: string) => {
      if (!user?.id) return;
      queryClient.setQueryData(["incoming-likes", user.id], (prev: any) => {
        const old = Array.isArray(prev) ? prev : [];
        return old.filter((u: any) => (u._id || u.id) !== targetUserId);
      });
      try {
        await axios.post(
          `${API_BASE_URL}/api/user/swipe`,
          { targetUserId, action: "dislike" },
          { headers: { Authorization: `Bearer ${user.token}` } },
        );
        queryClient.invalidateQueries({ queryKey: ["potential-matches"] });
      } catch (error) {
        refetch();
      }
    },
    [user, queryClient, refetch],
  );

  const handleLike = async (targetUserId: string) => {
    if (!user?.id || isProcessing) return;
    setIsProcessing(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/user/swipe`,
        { targetUserId, action: "like" },
        { headers: { Authorization: `Bearer ${user.token}` } },
      );
      if (response.data.match) {
        setMatchData({
          ...response.data.matchedUser,
          conversationId: response.data.conversationId,
        });
        socket?.emit("likeSent", { targetUserId });
        queryClient.invalidateQueries({ queryKey: ["my-matches", user.id] });
      }
      queryClient.setQueryData(["incoming-likes", user.id], (prev: any) => {
        const old = Array.isArray(prev) ? prev : [];
        return old.filter((u: any) => (u._id || u.id) !== targetUserId);
      });
    } catch (error) {
      console.error("❌ [LikesTab] Greška pri lajkovanju:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendMessage = useCallback(
    async (message: string) => {
      if (!matchData || !user?.id) {
        setMatchData(null);
        return;
      }
      const targetUserId = matchData._id;
      const trimmedMessage = message.trim();
      if (!trimmedMessage) {
        showToast("Match saved!", "success");
        setMatchData(null);
        return;
      }
      if (!socket?.connected) {
        socket?.connect();
        await new Promise<void>((resolve) => {
          socket?.once("connect", () => resolve());
          setTimeout(() => resolve(), 3000);
        });
      }
      socket?.emit(
        "sendMessage",
        { receiverId: targetUserId, text: trimmedMessage },
        (response: any) => {
          if (response?.status === "ok") {
            showToast("Message sent!", "success");
            queryClient.invalidateQueries({ queryKey: ["my-matches", user.id] });
          } else {
            showToast("Failed to send message.", "error");
          }
          setMatchData(null);
        },
      );
    },
    [matchData, socket, user?.id, queryClient, showToast],
  );

  return (
    <View style={styles.container}>
      <Header onFilterClick={showModal} />

      {/* ── LIKES HEADER ── */}
      <View style={styles.likesHeader}>
        <View style={styles.likesBadge}>
          <Ionicons name="heart" size={15} color={COLORS.primary} />
          <Text style={styles.likesCount}>{likes.length}</Text>
          <Text style={styles.likesLabel}>
            {likes.length === 1 ? "like" : "likes"}
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      ) : likes.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyIconBox}>
            <Ionicons name="heart-outline" size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.emptyTitle}>No likes yet</Text>
          <Text style={styles.emptyText}>
            When someone likes your profile, they&apos;ll appear here.
          </Text>
        </View>
      ) : (
        <>
          <LikesGrid
            data={likes}
            isPremium={false}
            onLike={handleLike}
            onSkip={handleSkip}
          />
          <LikesCTA isPremium={false} onPress={() => {}} />
        </>
      )}

      {!!matchData && (
        <Modal visible={true} animationType="fade" transparent={true}>
          <View style={styles.fullScreenMatch}>
            <MatchAnimation
              matchedUser={matchData}
              onSendMessage={handleSendMessage}
              onClose={() => setMatchData(null)}
            />
          </View>
        </Modal>
      )}

      {!!toastMessage && (
        <View
          style={[
            styles.toast,
            toastMessage.type === "success" ? styles.toastSuccess : styles.toastError,
          ]}
        >
          <Ionicons
            name={toastMessage.type === "success" ? "checkmark-circle" : "alert-circle"}
            size={18}
            color="#fff"
          />
          <Text style={styles.toastText}>{toastMessage.message}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Likes header badge
  likesHeader: {
    alignItems: "center",
    paddingVertical: 12,
  },
  likesBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 30,
  },
  likesCount: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: -0.3,
  },
  likesLabel: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "600",
  },

  // Loading / empty
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 60,
    gap: 12,
  },
  emptyIconBox: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    paddingHorizontal: 40,
    lineHeight: 20,
  },

  // Match modal
  fullScreenMatch: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Toast
  toast: {
    position: "absolute",
    top: 56,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    zIndex: 99999,
    elevation: 20,
    maxWidth: "88%",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  toastSuccess: {
    backgroundColor: "#10B981",
  },
  toastError: {
    backgroundColor: "#EF4444",
  },
  toastText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
    flexShrink: 1,
  },
});