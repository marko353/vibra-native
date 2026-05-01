import { useEffect } from 'react';
import { useRouter } from 'expo-router';
// Removed the usePushNotifications call to avoid duplicate notifications
// const { fcmToken } = usePushNotifications(); // Initialize push notifications

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login'); // Navigacija na login ekran
  }, []);

  return null;
}