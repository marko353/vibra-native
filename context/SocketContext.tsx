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
        console.log('🧹 SocketContext: logout → gasim socket');
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    console.log('🔌 SocketContext: pokušavam konekciju…');

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
      console.log('🧹 SocketContext: Cleanup → gasim socket');
      newSocket.disconnect();
    };
  }, [user]);

  // ================= 📩 MESSAGE LISTENER =================
  useEffect(() => {
    if (!socket) return;

    const onReceiveMessage = (data: any) => {
      console.log('📩 receiveMessage → palim chat badge', data);
      setHasUnread(true);
    };

    console.log('🔌 SocketContext: slušam receiveMessage');
    socket.on('receiveMessage', onReceiveMessage);

    return () => {
      console.log('🧹 SocketContext: skidam receiveMessage');
      socket.off('receiveMessage', onReceiveMessage);
    };
  }, [socket]);

  // ================= 💖 MATCH LISTENER =================
  useEffect(() => {
    if (!socket) return;

    const onNewMatch = (data: any) => {
      console.log('💖 match → palim chat badge', data);
      setHasUnread(true);
    };

    console.log('🔌 SocketContext: slušam match');
    socket.on('match', onNewMatch);

    return () => {
      console.log('🧹 SocketContext: skidam match');
      socket.off('match', onNewMatch);
    };
  }, [socket]);

  // ================= ❤️ LIKE RECEIVED =================
  useEffect(() => {
    if (!socket || !user?.id) return;

    const onLikeReceived = (data: any) => {
      console.log('❤️ likeReceived → invalidiram incoming-likes', data);

      queryClient.invalidateQueries({
        queryKey: ['incoming-likes', user.id],
      });
    };

    console.log('🔌 SocketContext: slušam likeReceived');
    socket.on('likeReceived', onLikeReceived);

    return () => {
      console.log('🧹 SocketContext: skidam likeReceived');
      socket.off('likeReceived', onLikeReceived);
    };
  }, [socket, user?.id, queryClient]);

  // ================= 🗑️ CONVERSATION REMOVED (NOVO) =================
  useEffect(() => {
    if (!socket) return;

    const onConversationRemoved = (data: any) => {
      console.log(
        '🗑️ conversationRemoved → gasim chat badge',
        data
      );

      // 🔴 GASI BADGE JER CHAT VIŠE NE POSTOJI
      setHasUnread(false);

      // 🔄 (opciono ali korisno)
      queryClient.invalidateQueries({
        queryKey: ['my-matches'],
      });
    };

    console.log('🔌 SocketContext: slušam conversationRemoved');
    socket.on('conversationRemoved', onConversationRemoved);

    return () => {
      console.log('🧹 SocketContext: skidam conversationRemoved');
      socket.off('conversationRemoved', onConversationRemoved);
    };
  }, [socket, queryClient]);

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
