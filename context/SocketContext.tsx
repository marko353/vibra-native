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
      console.log('✅ Socket povezan');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // ❤️ NOVI LAJK
 socket.on('likeReceived', (payload) => {
  console.log('❤️ Primljen likeReceived:', payload);
  
  queryClient.setQueryData(['incoming-likes', user.id], (old: any) => {
    const currentLikes = Array.isArray(old) ? old : [];
    
    // 1. Provera da duplikate
    if (currentLikes.some((u: any) => u._id === payload.fromUserId)) return currentLikes;

    // 2. Dodajemo birthDate u novi objekat
    const newEntry = { 
      _id: payload.fromUserId, 
      avatar: payload.avatar ?? '', 
      fullName: payload.fullName ?? 'Novi lajk', 
      birthDate: payload.birthDate, // <--- OVO JE FALILO
      createdAt: new Date().toISOString() 
    };

    return [newEntry, ...currentLikes];
  });
});

    // 🔥 NOVI MATCH
    socket.on('match', (payload) => {
      console.log('🔥 Primljen MATCH:', payload);
      setHasUnread(true); // Aktivira bedž na Chat tabu

      queryClient.setQueryData(['incoming-likes', user.id], (old: any) => {
        if (!old || !Array.isArray(old)) return [];
        return old.filter((item: any) => item._id !== payload.userId);
      });

      queryClient.invalidateQueries({ queryKey: ['incoming-likes', user.id] });
      queryClient.invalidateQueries({ queryKey: ['conversations', user.id] });
    });

    // 📩 NOVA PORUKA (Ovo ti je falilo)
    socket.on('receiveMessage', (message) => {
      console.log('📩 Primljena poruka:', message);
      setHasUnread(true); // Aktivira bedž
      
      // Osvežava listu konverzacija da bi se nova poruka odmah videla
      queryClient.invalidateQueries({ queryKey: ['conversations', user.id] });
    });

    socket.on('conversationRemoved', (payload) => {
  console.log('🗑️ Unmatch detektovan, sklanjam bedž...');
  
  // 1. Osveži liste (da konverzacija nestane iz UI-ja)
  queryClient.invalidateQueries({ queryKey: ['incoming-likes', user.id] });
  queryClient.invalidateQueries({ queryKey: ['conversations', user.id] });

  // 2. ISKLJUČI BEDŽ
  // Čim je konverzacija uklonjena, pretpostavljamo da taj "unread" više ne važi
  setHasUnread(false); 
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
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected, hasUnread, setHasUnread }}>
      {children}
    </SocketContext.Provider>
  );
};