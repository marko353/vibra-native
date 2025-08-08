import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useAuthContext } from './AuthContext';

export interface UserProfile {
  bio: string | null;
  relationshipType: string | null;
  interests: string[];
  height: number | null;
  languages: string[];
  horoscope: string | null;
  familyPlans: string | null;
  communicationStyle: string | null;
  loveStyle: string | null;
  pets: string | null;
  drinks: string | null;
  smokes: string | null;
  workout: string | null;
  diet: string | null;
  job: string | null;
  education: string | null;
  // Promenjen je tip za 'location' u objekat ili null
  location: { locationCity: string; locationCountry: string } | null;
  gender: string | null;
  sexualOrientation: string | null;
  showLocation?: boolean; // Dodao sam showLocation ako je potrebno
}

interface ProfileContextType {
  profile: UserProfile;
  setProfileField: (field: keyof UserProfile, value: any) => void;
  loadProfile: (data: Partial<UserProfile>) => void;
  resetProfile: () => void;
  signOut: () => void;
}

const defaultProfileState: UserProfile = {
  bio: null,
  relationshipType: null,
  interests: [],
  height: null,
  languages: [],
  horoscope: null,
  familyPlans: null,
  communicationStyle: null,
  loveStyle: null,
  pets: null,
  drinks: null,
  smokes: null,
  workout: null,
  diet: null,
  job: null,
  education: null,
  location: null,
  gender: null,
  sexualOrientation: null,
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile>(defaultProfileState);
  const { logout: authSignOut } = useAuthContext();

  const loadProfile = (data: Partial<UserProfile>) => {
    setProfile((prev) => ({
      ...prev,
      ...data,
    }));
  };

  const resetProfile = () => {
    setProfile(defaultProfileState);
  };

  const setProfileField = (field: keyof UserProfile, value: any) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const signOut = () => {
    resetProfile();
    authSignOut();
  };

  const value = {
    profile,
    setProfileField,
    loadProfile,
    resetProfile,
    signOut,
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile mora biti korišćen unutar ProfileProvider-a');
  }
  return context;
};