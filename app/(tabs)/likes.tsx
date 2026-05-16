import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Modal, StyleSheet, Text, View } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useFilterModal } from "../../context/FilterModalContext";

import Header from "../../components/Header";
import LikesCTA from "../../components/likes/LikesCTA";
import LikesGrid from "../../components/likes/LikesGrid";
import MatchAnimation from "../../components/MatchAnimation";
import { useAuthContext } from "../../context/AuthContext";
import { useSocketContext } from "../../context/SocketContext";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

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

  const showToast = useCallback(
    (message: string, type: "success" | "error") => {
      setToastMessage({ message, type });
      setTimeout(() => setToastMessage(null), 3000);
    },
    [],
  );

  // 1. Fetch dolaznih lajkova
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

  // 2. Socket listeneri
  useEffect(() => {
    if (!socket) return;
    const handleSocketEvent = (data: any) => {
      console.log("❤️ [LikesTab] likeReceived/newIncomingLike event:", data);
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

  // 3. Handle Skip
  const handleSkip = useCallback(
    async (targetUserId: string) => {
      if (!user?.id) return;
      console.log("👎 [LikesTab] Skip:", targetUserId);
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
        console.error("❌ [LikesTab] Greška pri skipovanju:", error);
        refetch();
      }
    },
    [user, queryClient, refetch],
  );

  // 4. Handle Like
  const handleLike = async (targetUserId: string) => {
    if (!user?.id || isProcessing) return;
    console.log("❤️ [LikesTab] Like:", targetUserId);
    setIsProcessing(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/user/swipe`,
        { targetUserId, action: "like" },
        { headers: { Authorization: `Bearer ${user.token}` } },
      );

      console.log("✅ [LikesTab] Swipe response:", {
        match: response.data.match,
        conversationId: response.data.conversationId,
      });

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

  // 5. Handler za poruke — koristi SOCKET umesto HTTP
  // HTTP POST ne emituje receiveMessage socket event ka primaocu
  const handleSendMessage = useCallback(
    async (message: string) => {
      console.log("🔥 [LikesTab] handleSendMessage pozvan", {
        hasMatchData: !!matchData,
        matchDataId: matchData?._id,
        conversationId: matchData?.conversationId,
        hasSocket: !!socket,
        socketConnected: socket?.connected,
        message,
      });

      if (!matchData || !user?.id) {
        console.log("❌ [LikesTab] Nema matchData ili user");
        setMatchData(null);
        return;
      }

      const targetUserId = matchData._id;
      const trimmedMessage = message.trim();

      if (!trimmedMessage) {
        console.log("ℹ️ [LikesTab] Prazna poruka, zatvaramo match screen");
        showToast("Match sačuvan!", "success");
        setMatchData(null);
        return;
      }

      // Čekamo da socket bude spreman ako nije
      if (!socket?.connected) {
        console.warn("⚠️ [LikesTab] Socket nije povezan, čekam reconnect...");
        socket?.connect();
        await new Promise<void>((resolve) => {
          socket?.once("connect", () => {
            console.log("✅ [LikesTab] Socket reconnected");
            resolve();
          });
          setTimeout(() => {
            console.warn("⏰ [LikesTab] Socket reconnect timeout");
            resolve();
          }, 3000);
        });
      }

      console.log("📤 [LikesTab] Emitujem sendMessage via socket", {
        receiverId: targetUserId,
        text: trimmedMessage,
        socketConnected: socket?.connected,
        socketId: socket?.id,
      });

      socket?.emit(
        "sendMessage",
        { receiverId: targetUserId, text: trimmedMessage },
        (response: any) => {
          console.log("📨 [LikesTab] sendMessage callback response:", response);
          if (response?.status === "ok") {
            console.log("✅ [LikesTab] Poruka uspešno poslata:", response.message?._id);
            showToast("Poruka uspešno poslata!", "success");
            queryClient.invalidateQueries({
              queryKey: ["my-matches", user.id],
            });
          } else {
            console.error("❌ [LikesTab] sendMessage greška:", response);
            showToast("Greška pri slanju poruke.", "error");
          }
          setMatchData(null);
        },
      );
    },
    [matchData, socket, user?.id, queryClient, showToast],
  );

  return (
    <View style={styles.container}>
      <Header title={`${likes.length} sviđanja`} onFilterClick={showModal} />

      <View style={styles.likesHeader}>
        <View style={styles.likesBadge}>
          <Text style={styles.likesCount}>{likes.length}</Text>
          <Text style={styles.likesLabel}>sviđanja</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FF6A00" />
        </View>
      ) : (
        <>
          {likes.length === 0 ? (
            <View style={styles.center}>
              <Text style={styles.emptyText}>Još uvek nema novih lajkova.</Text>
            </View>
          ) : (
            <LikesGrid
              data={likes}
              isPremium={false}
              onLike={handleLike}
              onSkip={handleSkip}
            />
          )}
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
            styles.toastContainer,
            toastMessage.type === "success"
              ? styles.toastSuccess
              : styles.toastError,
          ]}
        >
          <Icon
            name={
              toastMessage.type === "success"
                ? "checkmark-circle"
                : "alert-circle"
            }
            size={20}
            color="#fff"
            style={{ marginRight: 10 }}
          />
          <Text style={styles.toastText}>{toastMessage.message}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  likesHeader: { alignItems: "center", marginVertical: 12 },
  likesBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFE4EA",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 30,
  },
  likesCount: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ff3b5c",
    marginRight: 6,
  },
  likesLabel: { fontSize: 15, color: "#ff3b5c", fontWeight: "500" },
  emptyText: { color: "#666", fontSize: 16, textAlign: "center" },
  fullScreenMatch: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    justifyContent: "center",
    alignItems: "center",
  },
  toastContainer: {
    position: "absolute",
    top: 50,
    alignSelf: "center",
    padding: 15,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 99999,
    elevation: 20,
    maxWidth: "90%",
  },
  toastSuccess: { backgroundColor: "#4CAF50" },
  toastError: { backgroundColor: "#F44336" },
  toastText: { color: "#fff", fontWeight: "600", fontSize: 14, flexShrink: 1 },
});