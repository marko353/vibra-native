import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthContext } from './AuthContext';
import { useQueryClient } from '@tanstack/react-query';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

// ================= TYPES =================
interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;

  // 🔴 CHAT BADGE
  hasUnread: boolean;
  setHasUnread: (value: boolean) => void;
}

// ================= CONTEXT =================
const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  hasUnread: false,
  setHasUnread: () => {},
});

// ================= HOOK =================
export const useSocketContext = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error(
      'useSocketContext mora da se koristi unutar SocketProvider-a'
    );
  }
  return context;
};

// ================= PROVIDER =================
export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // 🔴 CHAT BADGE STATE
  const [hasUnread, setHasUnread] = useState(false);

  // ================= SOCKET CONNECT =================
  useEffect(() => {
    if (!user?.token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const newSocket = io(API_BASE_URL!, {
      auth: { token: user.token },
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('✅ SocketContext: Povezan, ID:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('🔴 SocketContext: Diskonektovan');
      setIsConnected(false);
    });

    return () => {
      console.log('🧹 SocketContext: Gasim socket');
      newSocket.disconnect();
    };
  }, [user]);

  // ================= 📩 MESSAGE LISTENER =================
  useEffect(() => {
    if (!socket) return;

    const onReceiveMessage = (data: any) => {
      console.log('📩 Nova poruka → palim chat badge', data);
      setHasUnread(true);
    };

    socket.on('receiveMessage', onReceiveMessage);

    return () => {
      socket.off('receiveMessage', onReceiveMessage);
    };
  }, [socket]);

  // ================= 💖 MATCH LISTENER =================
  useEffect(() => {
    if (!socket) return;

    const onNewMatch = (data: any) => {
      console.log('💖 Novi match → palim chat badge', data);
      setHasUnread(true);
    };

    socket.on('match', onNewMatch);

    return () => {
      socket.off('match', onNewMatch);
    };
  }, [socket]);

  // ================= ❤️ LIKE RECEIVED LISTENER (NOVO) =================
  useEffect(() => {
    if (!socket || !user?.id) return;

    const onLikeReceived = (data: any) => {
      console.log('❤️ Like received → invalidiram Likes tab', data);

      // 🔥 INVALIDACIJA LIKES QUERY-JA ZA OVOG USERA
      queryClient.invalidateQueries({
        queryKey: ['incoming-likes', user.id],
      });
    };

    socket.on('likeReceived', onLikeReceived);

    return () => {
      socket.off('likeReceived', onLikeReceived);
    };
  }, [socket, user?.id, queryClient]);

  // ================= PROVIDER =================
  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        hasUnread,
        setHasUnread,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
