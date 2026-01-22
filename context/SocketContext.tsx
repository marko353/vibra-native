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
      console.log('🔥 [Socket] Match:', payload);

      const { initiatorId } = payload;

      // ako JA nisam kliknuo poslednji → pali bedž
      if (initiatorId !== user.id) {
        console.log('🔔 [Socket] Palim bedž (User A)');
        setHasUnread(true);
      }

      queryClient.invalidateQueries({
        queryKey: ['incoming-likes', user.id],
      });

      queryClient.invalidateQueries({
        queryKey: ['my-matches', user.id],
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
        queryKey: ['my-matches', user.id],
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
        queryKey: ['incoming-likes', user.id],
      });

      queryClient.invalidateQueries({
        queryKey: ['my-matches', user.id],
      });
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user?.token, user?.id]);

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
