import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';


export interface User {
  id: string;
  fullName: string;
  email: string;
  token: string;
  birthYear?: number;
  avatar?: string;
  profilePictures?: string[];
  birthDate?: string;
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
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();


  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('currentUser');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('❌ Failed to load user from storage', error);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    const saveUser = async () => {
      try {
        if (user) {
          await AsyncStorage.setItem('currentUser', JSON.stringify(user));
        } else {
          await AsyncStorage.removeItem('currentUser');
        }
      } catch (error) {
        console.error('❌ Failed to save user to storage', error);
      }
    };
    saveUser();
  }, [user]);

  const logout = async () => {
    console.log("[AuthContext] Pokrenuta logout funkcija.");
    setUser(null);
    await AsyncStorage.removeItem('currentUser');
    
    // 👇 KLJUČNA IZMENA: Brišemo i odluku o lokaciji 👇
    await AsyncStorage.removeItem('location_prompt_completed');
    console.log("[AuthContext] Odluka o lokaciji obrisana iz AsyncStorage.");
    
    queryClient.clear();
    console.log("[AuthContext] React Query keš je obrisan!");
  };

  const updateUser = (newUserData: Partial<User>) => {
    setUser((prevUser) => {
      if (!prevUser) return null;
      return { ...prevUser, ...newUserData };
    });
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

export { AuthProvider, useAuthContext };

