import notifee, {
  AndroidImportance,
  AndroidVisibility,
} from "@notifee/react-native";
import messaging from "@react-native-firebase/messaging";
import { useEffect, useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import { getApps } from "@react-native-firebase/app";
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';

// --- POMOĆNE FUNKCIJE ---

async function createNotificationChannel() {
  return await notifee.createChannel({
    id: "default",
    name: "Vibra Obaveštenja",
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
  });
}

const shownNotifications = new Set<string>();

async function onDisplayNotification(title: string, body: string, messageId?: string, data?: any) {
  const id = messageId || `${Date.now()}`;

  if (shownNotifications.has(id)) return;
  shownNotifications.add(id);
  setTimeout(() => shownNotifications.delete(id), 10000);

  const channelId = await createNotificationChannel();
  await notifee.displayNotification({
    title,
    body,
    data, // Ovo je ključno da bi klik na Notifee notifikaciju preneo chatId
    android: {
      channelId,
      smallIcon: "ic_notification",
      largeIcon: require("../assets/images/vibraNotification.png"),
      importance: AndroidImportance.HIGH,
      pressAction: { id: "default" },
    },
  });
}

const requestPermission = async () => {
  try {
    const authStatus = await messaging().requestPermission();
    return (
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL
    );
  } catch {
    console.error("‼️ [PushNotifications] Error while requesting permission.");
    return false;
  }
};

let isTokenSentGlobal = false;

// --- GLAVNI HOOK ---

export const usePushNotifications = (userJwtToken?: string | null) => {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let isCancelled = false;
    let unsubscribeMessaging: (() => void) | undefined;

    const setup = async () => {
      try {
        if (getApps().length === 0 || isCancelled) return;

        // 1. Dozvole
        if (Platform.OS === "android" && Platform.Version >= 33) {
          await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
        }
        const hasPermission = await requestPermission();
        if (!hasPermission || isCancelled) return;

        // 2. Token Handling
        const token = await messaging().getToken();
        console.log("🔍 [PushNotifications] FCM token:", token);
        console.log("🔍 [PushNotifications] JWT token:", userJwtToken);
        if (token && !isCancelled) {
          setFcmToken(token);
          if (userJwtToken && !isTokenSentGlobal) {
            console.log("🔄 [PushNotifications] Šaljem FCM token na backend...");
            await saveFcmTokenToBackend(token, userJwtToken);
          }
        }

        // 3. LISTENERS ZA KLIK (Navigacija)

        // Scenarijo A: Aplikacija je bila potpuno ugašena
        messaging()
          .getInitialNotification()
          .then(remoteMessage => {
            if (remoteMessage?.data?.chatId) {
              console.log("🚀 App otvorena iz Quit stanja, chatId:", remoteMessage.data.chatId);
              // Malo kašnjenje da se root layout učita
              setTimeout(() => {
                router.push({
                  pathname: "/chat-stack/[chatId]",
                  params: { chatId: String(remoteMessage.data?.chatId) }
                });
              }, 1000);
            }
          });

        // Scenarijo B: Aplikacija je bila u pozadini (Background)
        messaging().onNotificationOpenedApp(remoteMessage => {
          if (remoteMessage?.data?.chatId) {
            console.log("📱 App otvorena iz Backgrounda, chatId:", remoteMessage.data.chatId);
            router.push({
              pathname: "/chat-stack/[chatId]",
              params: { chatId: String(remoteMessage.data.chatId) }
            });
          }
        });

        // 4. FOREGROUND LISTENER (Dok korisnik gleda u aplikaciju)
        unsubscribeMessaging = messaging().onMessage(async (remoteMessage) => {
          console.log("📥 Foreground poruka:", remoteMessage.data);
          
          const title = remoteMessage.notification?.title || remoteMessage.data?.title || "Vibra";
          const body = remoteMessage.notification?.body || remoteMessage.data?.body || "Nova poruka";
          
          await onDisplayNotification(
            String(title), 
            String(body), 
            remoteMessage.messageId,
            remoteMessage.data // Prosleđujemo podatke Notifee-u
          );
        });

        // 5. NOTIFEE KLIK (Za foreground notifikacije)
        return notifee.onForegroundEvent(({ type, detail }) => {
          if (type === 1 /* PressAction */ && detail.notification?.data?.chatId) {
            router.push({
              pathname: "/chat-stack/[chatId]",
              params: { chatId: String(detail.notification.data.chatId) }
            });
          }
        });

      } catch (error) {
        console.error("❌ Setup Error:", error);
      }
    };

    setup();

    return () => {
      isCancelled = true;
      if (unsubscribeMessaging) unsubscribeMessaging();
    };
  }, [userJwtToken, router]);

  const saveFcmTokenToBackend = async (token: string, jwt: string) => {
    try {
      const apiUrl = (Constants.expoConfig?.extra?.EXPO_PUBLIC_API_BASE_URL || "http://192.168.1.6:5000") as string;
      console.log("🔄 [PushNotifications] Sending FCM token to backend:", token);
      const response = await fetch(`${apiUrl}/api/user/save-fcm-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${jwt}`,
        },
        body: JSON.stringify({ fcmToken: token }),
      });
      if (response.ok) {
        console.log("✅ [PushNotifications] FCM token successfully sent to backend.");
        isTokenSentGlobal = true;
      } else {
        console.error("❌ [PushNotifications] Failed to send FCM token. Response:", await response.json());
      }
    } catch (error) {
      console.error("‼️ [PushNotifications] Error while sending FCM token:", error);
    }
  };

  return { fcmToken };
};