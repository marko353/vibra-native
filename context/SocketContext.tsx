import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthContext } from './AuthContext'; // Uvozimo AuthContext da bismo znali da li je korisnik ulogovan

// Adresa tvog backend servera
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

// Definišemo tip vrednosti koje će naš kontekst pružati
interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

// 1. Kreiramo Kontekst sa početnom, praznom vrednošću
const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

// 2. Kreiramo "custom hook" da bismo lakše koristili kontekst u drugim komponentama
export const useSocket = () => {
  return useContext(SocketContext);
};

// 3. Kreiramo Provider komponentu koja će obmotati našu aplikaciju
export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuthContext(); // Uzimamo podatke o korisniku iz AuthContext-a
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // useEffect je "srce" ovog fajla. On upravlja životnim ciklusom konekcije.
  useEffect(() => {
    // Ako korisnik POSTOJI (ulogovan je i ima token)
    if (user?.token) {
      // Kreiramo novu socket konekciju
      const newSocket = io(API_BASE_URL!, {
        // Šaljemo token serveru radi autentifikacije
        auth: {
          token: user.token,
        },
      });

      // Postavljamo socket u stanje da bude dostupan celoj aplikaciji
      setSocket(newSocket);

      // Slušamo za događaje
      newSocket.on('connect', () => {
        console.log('✅ SocketContext: Povezan na server, ID:', newSocket.id);
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('🔴 SocketContext: Diskonektovan sa servera.');
        setIsConnected(false);
      });

      // Cleanup funkcija: Ovo se izvršava kada se korisnik izloguje.
      // Ključno je da se konekcija prekine da ne bi ostala da "visi".
      return () => {
        console.log('🧹 SocketContext: Zatvaram socket konekciju.');
        newSocket.disconnect();
      };
    } 
    // Ako korisnik NE POSTOJI (izlogovao se)
    else {
      // Ako postoji stara konekcija, obavezno je ugasi
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
    }
    // Ovaj efekat se ponovo pokreće SAMO kada se `user` objekat promeni (login/logout)
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
