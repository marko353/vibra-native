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
  onNotificationOpenedApp,
  requestPermission,
  AuthorizationStatus,
} from "@react-native-firebase/messaging";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

interface MatchToastData {
  matchedUserName: string;
  matchedUserAvatar?: string;
  chatId: string;
  userId: string;
}

let isTokenSentGlobal = false;

const messagingInstance = getMessaging();

const validAvatar = (avatar: any): string | undefined => {
  if (!avatar) return undefined;
  const str = String(avatar).trim();
  if (str.length === 0 || !str.startsWith("http")) return undefined;
  return str;
};

async function getOrCreateChannel(id: string, name: string) {
  return await notifee.createChannel({
    id,
    name,
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
    vibration: true,
  });
}

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
      largeIcon: validAvatar(data.userAvatar),
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

async function displayMessageNotification(title: string, body: string, data: any) {
  const currentChatId = await AsyncStorage.getItem("currentChatId");

  if (currentChatId && currentChatId === data.chatId) {
    return;
  }

  const settings = await notifee.getNotificationSettings();
  if (settings.authorizationStatus === 0) {
    await notifee.requestPermission();
  }

  const channelId = await getOrCreateChannel("messages", "Vibra Poruke");

  try {
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
        largeIcon: validAvatar(data.userAvatar),
        circularLargeIcon: true,
        style: {
          type: AndroidStyle.BIGTEXT,
          text: body,
          title: `<b>${data.userName || title}</b>`,
          summary: "Vibra",
        },
      },
    });
  } catch (e) {
    console.error("❌ [displayMessage] Error:", e);
  }
}

async function displayDefaultNotification(title: string, body: string, data: any) {
  const channelId = await getOrCreateChannel("default", "Vibra Notifications");
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

const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    const authStatus = await requestPermission(messagingInstance);
    const granted =
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL;
    console.log(`[Permissions] Firebase permission ${granted ? "granted ✅" : "denied ❌"} (status: ${authStatus})`);
    return granted;
  } catch (error) {
    console.error("❌ [Permissions] Error:", error);
    return false;
  }
};

const navigateToChat = (router: any, data: any) => {
  if (!data?.chatId) {
    console.warn("[Navigation] No chatId, skipping.");
    return;
  }
  router.push({
    pathname: "/chat-stack/[chatId]",
    params: {
      chatId: String(data.chatId),
      userName: String(data.userName || "User"),
      userAvatar: String(data.userAvatar || ""),
      receiverId: String(data.receiverId || data.userId || ""),
    },
  });
};

export const usePushNotifications = (
  userJwtToken?: string | null,
  onMatchReceived?: (data: MatchToastData) => void,
) => {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const router = useRouter();

  const saveFcmTokenToBackend = async (token: string, jwt: string) => {
    if (isTokenSentGlobal) return;
    isTokenSentGlobal = true;

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
        console.log("✅ [FCM] Token saved.");
      } else {
        const errData = await response.json();
        console.error("❌ [FCM] Server rejected token:", errData);
        isTokenSentGlobal = false;
      }
    } catch (error) {
      console.error("❌ [FCM] Network error:", error);
      isTokenSentGlobal = false;
    }
  };

  // 1. Generate FCM token + request permissions
  useEffect(() => {
    const fetchFcmToken = async (retryCount = 0) => {
      try {
        const hasPermission = await requestNotificationPermission();
        if (!hasPermission) return;

        const notifeeSettings = await notifee.requestPermission();
        console.log("[Notifee] Permission status:", notifeeSettings.authorizationStatus);

        const token = await getToken(messagingInstance);
        if (token) {
          setFcmToken(token);
          if (userJwtToken) await saveFcmTokenToBackend(token, userJwtToken);
        }
      } catch (error) {
        const msg = (error as any)?.message || "";
        if (msg.includes("SERVICE_NOT_AVAILABLE")) return;
        if (retryCount < 3) {
          setTimeout(() => fetchFcmToken(retryCount + 1), 3000 * (retryCount + 1));
        }
      }
    };

    fetchFcmToken();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Watchdog — send token if not sent yet
  useEffect(() => {
    if (fcmToken && userJwtToken && !isTokenSentGlobal) {
      saveFcmTokenToBackend(fcmToken, userJwtToken);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fcmToken, userJwtToken]);

  // 3. Token refresh + foreground messages
  useEffect(() => {
    const unsubRefresh = onTokenRefresh(messagingInstance, (newToken) => {
      setFcmToken(newToken);
      isTokenSentGlobal = false;
      if (userJwtToken) saveFcmTokenToBackend(newToken, userJwtToken);
    });

    const unsubMessage = onMessage(messagingInstance, async (remoteMessage) => {
      const data = remoteMessage.data;
      if (!data) return;

      const title = String(data.title || "Vibra");
      const body = String(data.body || "New message");

      if (data.type === "MATCH" && onMatchReceived) {
        onMatchReceived({
          matchedUserName: String(data.userName || "User"),
          matchedUserAvatar: data.userAvatar as string | undefined,
          chatId: String(data.chatId || ""),
          userId: String(data.userId || ""),
        });
        return;
      } else if (data.type === "MESSAGE") {
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

  // 4. Background FCM click
  useEffect(() => {
    const unsub = onNotificationOpenedApp(messagingInstance, (msg) => {
      navigateToChat(router, msg.data);
    });
    return () => unsub();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 5. Foreground Notifee click
  useEffect(() => {
    const unsub = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) {
        navigateToChat(router, detail.notification?.data);
      }
    });
    return () => unsub();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 6. Pending AsyncStorage navigation (background → foreground)
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
        console.error("❌ [AsyncStorage] Error:", e);
      }
    };
    checkPending();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userJwtToken, router]);

  // 7. New user login — refresh FCM token
  useEffect(() => {
    if (!userJwtToken) return;

    isTokenSentGlobal = false;
    setFcmToken(null);

    const fetchNewToken = async () => {
      try {
        const token = await getToken(messagingInstance);
        if (token) {
          setFcmToken(token);
          await saveFcmTokenToBackend(token, userJwtToken);
        }
      } catch (error) {
        console.error("❌ [FCM] Error generating new token:", error);
      }
    };

    fetchNewToken();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userJwtToken]);

  return { fcmToken };
};