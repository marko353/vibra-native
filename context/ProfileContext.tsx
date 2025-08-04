import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuthContext } from './AuthContext';
import { ActivityIndicator, View } from 'react-native';

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
  location: string | null;
  gender: string | null;
  sexualOrientation: string | null;
}

interface ProfileContextType {
  profile: UserProfile;
  setProfileField: (field: keyof UserProfile, value: any) => void;
  loadProfile: (data: Partial<UserProfile>) => void;
  resetProfile: () => void;
  fetchProfile: () => Promise<void>;
  signOut: () => void;
  // Dodajemo funkciju za ažuriranje i prateće stanje
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  isUpdating: boolean;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile>({
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
  });
  
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const { user, loading: authLoading, logout: authSignOut } = useAuthContext();

  const fetchProfileFromBackend = async () => {
    if (!user) {
        setIsProfileLoading(false);
        return;
    }

    try {
      setIsProfileLoading(true);
      // VAŽNO: Molimo vas da zamenite ovaj URL sa stvarnim API URL-om
      const response = await fetch(`https://your-actual-api-url.com/profile/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Nije moguće preuzeti profil');
      }

      const data = await response.json();
      setProfile(data);
    } catch (error) {
      console.error('Greška pri preuzimanju profila:', error);
    } finally {
      setIsProfileLoading(false);
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;

    setIsUpdating(true);
    try {
      // VAŽNO: Molimo vas da zamenite ovaj URL sa stvarnim API URL-om
      const response = await fetch(`https://your-actual-api-url.com/profile/${user.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Ažuriranje profila neuspešno');
      }

      const updatedData = await response.json();
      // Ažuriramo lokalno stanje sa novim podacima
      setProfile(prevProfile => ({ ...prevProfile, ...updatedData }));
      
    } catch (error) {
      console.error('Greška pri ažuriranju profila:', error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    if (user && !authLoading) {
      fetchProfileFromBackend();
    } else if (!user && !authLoading) {
      resetProfile();
      setIsProfileLoading(false);
    }
  }, [user, authLoading]);

  const setProfileField = (field: keyof UserProfile, value: any) => {
    setProfile((prevProfile) => ({ ...prevProfile, [field]: value }));
  };

  const loadProfile = (data: Partial<UserProfile>) => {
    setProfile((prevProfile) => ({ ...prevProfile, ...data }));
  };

  const resetProfile = () => {
    setProfile({
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
    });
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
    fetchProfile: fetchProfileFromBackend, 
    signOut,
    updateProfile,
    isUpdating,
  };

  if (isProfileLoading || authLoading) {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" />
        </View>
    );
  }

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile mora biti korišćen unutar ProfileProvider-a');
  }
  return context;
};
