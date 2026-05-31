import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthContext } from './AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import messaging from '@react-native-firebase/messaging';
import { showMatchNotification } from '../hooks/usePushNotifications';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  hasUnread: boolean;
  setHasUnread: (value: boolean) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  hasUnread: false,
  setHasUnread: () => {},
});

export const useSocketContext = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    if (!user?.token || !user?.id) return;
    if (socketRef.current) return;

    const socket = io(API_BASE_URL!, {
      auth: { token: user.token },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ [Socket] Povezan');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    /**
     * 🔥 MATCH CREATED
     * ✅ BEDŽ SAMO ZA USERA KOJI NIJE TRIGEROVAO MATCH
     */
    socket.on('match', (payload) => {
      console.log('🔥 [Socket] Match received:', payload);

      // Prikaz notifikacije
      showMatchNotification({
        fullName: payload.matchedUser.fullName,
        avatar: payload.matchedUser.avatar,
        chatId: payload.chatId,
        userId: payload.matchedUser?._id,
      });

      // Osvježavanje podataka
      queryClient.invalidateQueries({
        queryKey: ['my-matches'],
      });

      queryClient.invalidateQueries({
        queryKey: ['unread-messages-count'],
      });
    });

    /**
     * 📩 NOVA PORUKA
     * (fallback ako bedž nije već upaljen)
     */
    socket.on('receiveMessage', (message) => {
      console.log('📩 [Socket] Nova poruka:', message);
      setHasUnread(true);

      queryClient.invalidateQueries({
        queryKey: ['my-matches'],
      });

      queryClient.invalidateQueries({
        queryKey: ['unread-messages-count'],
      });
    });

    /**
     * 🗑️ UNMATCH / OBRISANA KONVERZACIJA
     * ❗ UVEK GASIMO BEDŽ
     */
    socket.on('conversationRemoved', (payload) => {
      console.log('🗑️ [Socket] Conversation removed:', payload);

      setHasUnread(false);

      queryClient.invalidateQueries({
        queryKey: ['incoming-likes'],
      });

      queryClient.invalidateQueries({
        queryKey: ['my-matches'],
      });

      queryClient.invalidateQueries({
        queryKey: ['unread-messages-count'],
      });
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false); // Resetovanje isConnected stanja
    };
  }, [user?.token, user?.id]);

  useEffect(() => {
    const getToken = async () => {
      const token = await messaging().getToken();
      console.log("🔥 FCM TOKEN (EMULATOR):", token);
    };

    getToken();
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        hasUnread,
        setHasUnread,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
