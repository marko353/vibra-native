import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { useRouter, usePathname } from 'expo-router';

export interface User {
  id: string;
  fullName: string;
  email: string;
  token: string;
  birthYear?: number;
  avatar?: string;
  profilePictures?: string[];
  birthDate?: string;
  locationCity?: string | null;
  
}

interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  loading: boolean;
  logout: () => Promise<void>;
  updateUser: (newUserData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const userRef = useRef<User | null>(null); // REF za uvek aktuelnog korisnika
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();

  // REF sync
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Učitavanje iz AsyncStorage
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('currentUser');
        if (storedUser) setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('❌ Failed to load user from storage', err);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  // Čuvanje u AsyncStorage
  useEffect(() => {
    const saveUser = async () => {
      try {
        if (user) await AsyncStorage.setItem('currentUser', JSON.stringify(user));
        else await AsyncStorage.removeItem('currentUser');
      } catch (err) {
        console.error('❌ Failed to save user to storage', err);
      }
    };
    saveUser();
  }, [user]);

  // Logout funkcija
  const logout = useCallback(async () => {
    setUser(null);
    try {
      await Promise.all([
        AsyncStorage.removeItem('currentUser'),
        AsyncStorage.removeItem('location_prompt_completed')
      ]);
    } catch (err) {
      console.error('❌ Greška pri brisanju AsyncStorage tokom logout-a', err);
    }
    queryClient.clear();
    router.replace('/login');
  }, [queryClient, router]);

  const updateUser = useCallback((newUserData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...newUserData } : null);
  }, []);

  // Axios interceptor za 401
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      res => res,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          console.warn('[Axios Interceptor] 401 Detected, logging out...');
          logout();
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuthContext must be used within AuthProvider');
  return context;
};

export { AuthProvider };
