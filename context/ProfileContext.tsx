import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { useAuthContext } from './AuthContext';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export interface UserProfile {
  _id?: string;
  bio: string | null;
  jobTitle: string | null;
  education: string[];
  location: { latitude?: number; longitude?: number; locationCity?: string } | null;
  showLocation?: boolean;
  gender: string | null;
  sexualOrientation: string | null;
  relationshipType: string | null;
  horoscope: string | null;
  familyPlans: string | null;
  communicationStyle: string | null;
  loveStyle: string | null;
  pets: string | null;
  drinks: string | null;
  smokes: string | null;
  workout: string | null;
  diet: string | null;
  height: number | null;
  languages: string[];
  interests: string[];
  fullName?: string;
  birthDate?: string;
  hasCompletedLocationPrompt?: boolean;
  profilePictures?: string[];
  avatar?: string;
}

const defaultProfile: UserProfile = {
  _id: undefined,
  bio: null,
  jobTitle: null,
  education: [],
  location: null,
  showLocation: false,
  gender: null,
  sexualOrientation: null,
  relationshipType: null,
  horoscope: null,
  familyPlans: null,
  communicationStyle: null,
  loveStyle: null,
  pets: null,
  drinks: null,
  smokes: null,
  workout: null,
  diet: null,
  height: null,
  languages: [],
  interests: [],
};

interface ProfileContextType {
  profile: UserProfile | null;
  isLoading: boolean;
  isRefetching: boolean;
  loadProfile: (data: Partial<UserProfile>) => void;
  setProfileField: <T extends keyof UserProfile>(field: T, value: UserProfile[T]) => void;
  resetProfile: () => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const useProfileContext = () => {
  const context = useContext(ProfileContext);
  if (!context) throw new Error('useProfileContext must be used within a ProfileProvider');
  return context;
};

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const { user, logout } = useAuthContext();
  const [profile, setProfileState] = useState<UserProfile | null>(null);

  const { data: fetchedProfile, error, isLoading, isRefetching } = useQuery<UserProfile, AxiosError>({
    queryKey: ['userProfile', user?.id],
    queryFn: async () => {
      if (!user || !user.token) {
        throw new Error('User not authenticated');
      }
      const res = await axios.get(`${API_BASE_URL}/api/user/profile`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      return res.data;
    },
    // ✅ KLJUČNA ISPRAVKA: Upit se izvršava SAMO ako korisnik postoji
    enabled: !!user?.id && !!user.token,
    retry: (failureCount, err) => {
      if (err.response?.status === 401) {
        return false;
      }
      return failureCount < 3;
    },
  });

  useEffect(() => {
    if (!user) {
      setProfileState(null);
    }
  }, [user]);

  useEffect(() => {
    if (fetchedProfile) {
      const completeProfile = { ...defaultProfile, ...fetchedProfile };
      setProfileState(completeProfile);
    }
    if (error) {
      if (error.response?.status === 401) {
        console.error('[ProfileContext] Error 401 - logging out user.');
        logout();
      } else {
        console.error('[ProfileContext] Error fetching profile:', error);
      }
    }
  }, [fetchedProfile, error, logout]);

  const loadProfile = useCallback((data: Partial<UserProfile>) => {
    setProfileState(prevProfile => ({
      ...(prevProfile ?? defaultProfile),
      ...data,
    }));
  }, []);

  const setProfileField = useCallback(
    <T extends keyof UserProfile>(field: T, value: UserProfile[T]) => {
      setProfileState(prevProfile => {
        if (!prevProfile) return null;
        return { ...prevProfile, [field]: value };
      });
    },
    []
  );

  const resetProfile = useCallback(() => {
    setProfileState(null);
  }, []);

  return (
    <ProfileContext.Provider value={{ profile, isLoading, isRefetching, loadProfile, setProfileField, resetProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};