import { useState, useEffect } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, AndroidVisibility } from '@notifee/react-native';
import app from '@react-native-firebase/app';

async function createNotificationChannel() {
  return await notifee.createChannel({
    id: 'default',
    name: 'Vibra Obaveštenja',
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
  });
}

async function onDisplayNotification(title: string, body: string) {
  try {
    console.log('🔔 Pokušavam da prikažem notifikaciju');

    const channelId = await createNotificationChannel();

    await notifee.displayNotification({
      title,
      body,
      android: {
        channelId,
        importance: AndroidImportance.HIGH,
        visibility: AndroidVisibility.PUBLIC,
        pressAction: {
          id: 'default',
        },
      },
    });

    console.log('✅ Notifikacija prikazana');
  } catch (error) {
    console.error('❌ Notifee Greška:', error);
  }
}

export const usePushNotifications = () => {
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const startSetup = async () => {
      try {
        if (!app.apps.length) {
          console.log('❌ Firebase nije inicijalizovan');
          return;
        }

        console.log('🚀 Pokrećem Push setup');

        // Android 13+ permission
        if (Platform.OS === 'android' && Platform.Version >= 33) {
          const permission = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );

          console.log('📱 Notification permission:', permission);
        }

        // Firebase permission
        await messaging().requestPermission();

        // Kreiraj kanal odmah
        await createNotificationChannel();
        await notifee.displayNotification({
          title: 'TEST PUSH',
          body: 'Ako vidiš ovo, sve radi',
          android: {
            channelId: 'default',
          },
        });

        // Dobij FCM token
        const token = await messaging().getToken();

        if (token) {
          console.log('🔥 FCM Token:', token);
          setFcmToken(token);
        }

        // Foreground listener
        unsubscribe = messaging().onMessage(async remoteMessage => {

          console.log(
            '📥 FULL MESSAGE:',
            JSON.stringify(remoteMessage, null, 2)
          );

          const title = String(
            remoteMessage.notification?.title ??
            remoteMessage.data?.title ??
            'Novi Match! 🔥'
          );

          const body = String(
            remoteMessage.notification?.body ??
            remoteMessage.data?.body ??
            'Pogledaj ko te je lajkovao.'
          );

          console.log('📩 Title:', title);
          console.log('📩 Body:', body);

          await onDisplayNotification(title, body);
        });

        // TEST NOTIFIKACIJA
        await notifee.displayNotification({
          title: 'Test Notifikacija 🔔',
          body: 'Ako vidiš ovo, Notifee radi!',
          android: {
            channelId: 'default',
          },
        });

      } catch (error) {
        console.error('❌ Push Setup Greška:', error);
      }
    };

    startSetup();

    return () => {
      if (unsubscribe) {
        console.log('🧹 Čistim listener...');
        unsubscribe();
      }
    };
  }, []);

  return { fcmToken };
};