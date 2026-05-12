import notifee, {
  AndroidImportance,
  AndroidVisibility,
  AndroidStyle,
  EventType,
} from "@notifee/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getMessaging,
  getToken,
  onTokenRefresh,
  onMessage,
  getInitialNotification,
  onNotificationOpenedApp,
  requestPermission,
  AuthorizationStatus,
  setBackgroundMessageHandler,
} from "@react-native-firebase/messaging";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

// --- TIPOVI ---
interface MatchToastData {
  matchedUserName: string;
  matchedUserAvatar?: string;
  chatId: string;
  userId: string;
}

// Globalni flag za sesiju
let isTokenSentGlobal = false;

// RN Firebase koristi google-services.json automatski
const messagingInstance = getMessaging();

// ─────────────────────────────────────────────────────────────────────────────
// BACKGROUND / QUIT handler — mora biti van komponente, na vrhu fajla
// Ovo se poziva kada Firebase primi data-only poruku dok je app u backgroundu/quit
// ─────────────────────────────────────────────────────────────────────────────
setBackgroundMessageHandler(messagingInstance, async (remoteMessage) => {
  console.log("[FCM Background] Poruka primljena:", remoteMessage.data);

  const data = remoteMessage.data;
  if (!data) return;

  const type = data.type;
  const title = String(data.title || "Vibra");
  const body = String(data.body || "");

  if (type === "MATCH") {
    await displayMatchNotification(title, body, data);
  } else if (type === "MESSAGE") {
    await displayMessageNotification(title, body, data);
  } else {
    await displayDefaultNotification(title, body, data);
  }
});

// --- NOTIFEE CHANNEL ---
async function getOrCreateChannel(id: string, name: string) {
  return await notifee.createChannel({
    id,
    name,
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
    vibration: true,
  });
}

// --- CUSTOM NOTIFIKACIJE ---

// 💘 Match notifikacija — narandžasto-roza gradijent stil
async function displayMatchNotification(title: string, body: string, data: any) {
  const channelId = await getOrCreateChannel("match", "Vibra Match");

  await notifee.displayNotification({
    title: `<b>${title}</b>`,
    body,
    data,
    android: {
      channelId,
      smallIcon: "ic_notification",
      color: "#FF6A00",
      importance: AndroidImportance.HIGH,
      pressAction: { id: "default" },
      showTimestamp: true,
      largeIcon: data.userAvatar || undefined,
      circularLargeIcon: true,
      style: {
        type: AndroidStyle.BIGTEXT,
        text: body,
        title: `💘 ${title}`,
        summary: "Vibra Match",
      },
    },
  });
}

// 💬 Message notifikacija — plavi stil sa avatar-om
async function displayMessageNotification(title: string, body: string, data: any) {
  const channelId = await getOrCreateChannel("messages", "Vibra Poruke");

  await notifee.displayNotification({
    title: `<b>${data.userName || title}</b>`,
    body,
    data,
    android: {
      channelId,
      smallIcon: "ic_notification",
      color: "#FF6A00",
      importance: AndroidImportance.HIGH,
      pressAction: { id: "default" },
      showTimestamp: true,
      largeIcon: data.userAvatar || undefined,
      circularLargeIcon: true,
      style: {
        type: AndroidStyle.BIGTEXT,
        text: body,
        title: `<b>${data.userName || title}</b>`,
        summary: "Vibra",
      },
    },
  });
}

// 🔔 Default notifikacija
async function displayDefaultNotification(title: string, body: string, data: any) {
  const channelId = await getOrCreateChannel("default", "Vibra Obaveštenja");

  await notifee.displayNotification({
    title,
    body,
    data,
    android: {
      channelId,
      smallIcon: "ic_notification",
      color: "#FF6A00",
      importance: AndroidImportance.HIGH,
      pressAction: { id: "default" },
      showTimestamp: true,
    },
  });
}

// --- DOZVOLE ---
const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    const authStatus = await requestPermission(messagingInstance);
    const granted =
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL;
    console.log(`[Permissions] Dozvola ${granted ? "odobrena ✅" : "odbijena ❌"} (status: ${authStatus})`);
    return granted;
  } catch (error) {
    console.error("❌ [Permissions] Greška:", error);
    return false;
  }
};

// --- NAVIGACIJA ---
const navigateToChat = (router: any, data: any) => {
  if (!data?.chatId) {
    console.warn("[Navigation] Nema chatId, preskačem.");
    return;
  }
  console.log("[Navigation] Navigiram na chat:", data);
  router.push({
    pathname: "/chat-stack/[chatId]",
    params: {
      chatId: String(data.chatId),
      userName: String(data.userName || "Korisnik"),
      userAvatar: String(data.userAvatar || ""),
      receiverId: String(data.receiverId || data.userId || ""),
    },
  });
};

// --- GLAVNI HOOK ---

export const usePushNotifications = (
  userJwtToken?: string | null,
  onMatchReceived?: (data: MatchToastData) => void,
) => {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const router = useRouter();

  const saveFcmTokenToBackend = async (token: string, jwt: string) => {
    try {
      const apiUrl = (
        Constants.expoConfig?.extra?.EXPO_PUBLIC_API_BASE_URL || "http://192.168.1.6:5000"
      ) as string;

      const response = await fetch(`${apiUrl}/api/user/save-fcm-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ fcmToken: token }),
      });

      if (response.ok) {
        console.log("✅ [FCM→Backend] Token sačuvan.");
        isTokenSentGlobal = true;
      } else {
        const errData = await response.json();
        console.error("❌ [FCM→Backend] Server odbio:", errData);
      }
    } catch (error) {
      console.error("‼️ [FCM→Backend] Network Error:", error);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. Generisanje FCM tokena
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchFcmToken = async (retryCount = 0) => {
      try {
        const hasPermission = await requestNotificationPermission();
        if (!hasPermission) return;

        const token = await getToken(messagingInstance);
        if (token) {
          console.log("✅ [FCM] Token:", token.substring(0, 20) + "...");
          setFcmToken(token);
          if (userJwtToken && !isTokenSentGlobal) {
            await saveFcmTokenToBackend(token, userJwtToken);
          }
        }
      } catch (error) {
        const msg = (error as any)?.message || "";
        if (msg.includes("SERVICE_NOT_AVAILABLE")) {
          console.warn("⚠️ [FCM] SERVICE_NOT_AVAILABLE — ignorišem.");
          return;
        }
        if (retryCount < 3) {
          setTimeout(() => fetchFcmToken(retryCount + 1), 3000 * (retryCount + 1));
        }
      }
    };

    fetchFcmToken();
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Watchdog
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (fcmToken && userJwtToken && !isTokenSentGlobal) {
      saveFcmTokenToBackend(fcmToken, userJwtToken);
    }
  }, [fcmToken, userJwtToken]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. Token refresh + Foreground poruke
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsubRefresh = onTokenRefresh(messagingInstance, (newToken) => {
      setFcmToken(newToken);
      isTokenSentGlobal = false;
      if (userJwtToken) saveFcmTokenToBackend(newToken, userJwtToken);
    });

    const unsubMessage = onMessage(messagingInstance, async (remoteMessage) => {
      console.log("📥 [FCM] Foreground poruka:", remoteMessage.data);
      const data = remoteMessage.data;
      if (!data) return;

      // MATCH — custom toast (ne diramo, radi odlično)
      if (data.type === "MATCH" && onMatchReceived) {
        onMatchReceived({
          matchedUserName: String(data.userName || "Korisnik"),
          matchedUserAvatar: data.userAvatar as string | undefined,
          chatId: String(data.chatId || ""),
          userId: String(data.userId || ""),
        });
        return;
      }

      // MESSAGE i ostalo — Notifee custom notifikacija
      const title = String(data.title || "Vibra");
      const body = String(data.body || "Nova poruka");

      if (data.type === "MESSAGE") {
        await displayMessageNotification(title, body, data);
      } else {
        await displayDefaultNotification(title, body, data);
      }
    });

    return () => {
      unsubRefresh();
      unsubMessage();
    };
  }, [userJwtToken, onMatchReceived]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. Klik — Background stanje
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onNotificationOpenedApp(messagingInstance, (msg) => {
      console.log("📂 [FCM] Background klik. Data:", msg.data);
      navigateToChat(router, msg.data);
    });

    return () => unsub();
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. Klik — Quit stanje
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    getInitialNotification(messagingInstance)
      .then((msg) => {
        if (msg?.data) {
          console.log("📬 [FCM] Quit klik. Data:", msg.data);
          setTimeout(() => navigateToChat(router, msg.data), 1000);
        }
      })
      .catch(console.error);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. Notifee foreground klik
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) {
        console.log("🔔 [Notifee] Klik. Data:", detail.notification?.data);
        navigateToChat(router, detail.notification?.data);
      }
    });

    return () => unsub();
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. Pending iz AsyncStorage
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const checkPending = async () => {
      try {
        const raw = await AsyncStorage.getItem("pendingNotificationData");
        if (raw) {
          const data = JSON.parse(raw);
          await AsyncStorage.removeItem("pendingNotificationData");
          if (userJwtToken) {
            setTimeout(() => navigateToChat(router, data), 500);
          }
        }
      } catch (e) {
        console.error("❌ [AsyncStorage] Greška:", e);
      }
    };

    checkPending();
  }, [userJwtToken, router]);

  return { fcmToken };
};