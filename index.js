import { registerRootComponent } from "expo";
import { ExpoRoot } from "expo-router";
import notifee, {
  AndroidImportance,
  AndroidVisibility,
  AndroidStyle,
  EventType,
} from "@notifee/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getMessaging,
  setBackgroundMessageHandler,
} from "@react-native-firebase/messaging";

const validAvatar = (avatar) => {
  if (!avatar) return undefined;
  const str = String(avatar).trim();
  if (str.length === 0 || !str.startsWith("http")) return undefined;
  return str;
};

const getOrCreateChannel = async (id, name) => {
  return await notifee.createChannel({
    id,
    name,
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
    vibration: true,
  });
};

// Notifee background click (app in background state)
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.PRESS) {
    const data = detail.notification?.data;
    if (data?.chatId) {
      await AsyncStorage.setItem("pendingNotificationData", JSON.stringify(data));
    }
  }
});

// FCM Background/Quit handler
setBackgroundMessageHandler(getMessaging(), async (remoteMessage) => {
  const data = remoteMessage.data;
  if (!data) return;

  const title = String(data.title || "Vibra");
  const body = String(data.body || "");

  // Save immediately — used if user taps notification in quit state
  await AsyncStorage.setItem(
    "lastNotificationData",
    JSON.stringify({ ...data, savedAt: Date.now() })
  );

  if (data.type === "MATCH") {
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
  } else if (data.type === "MESSAGE") {
    const channelId = await getOrCreateChannel("messages", "Vibra Messages");
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
  } else {
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
});

const ctx = require.context("./app");
export default function App() {
  return <ExpoRoot context={ctx} />;
}

registerRootComponent(App);