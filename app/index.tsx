import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { usePushNotifications } from '../hooks/usePushNotifications';

export default function Index() {
  const router = useRouter();
  const { fcmToken } = usePushNotifications(); // Initialize push notifications

  useEffect(() => {
    router.replace('/login'); // Navigacija na login ekran
  }, []);

  return null;
}