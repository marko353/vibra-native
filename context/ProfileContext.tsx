import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useCallback,
} from 'react';

// Ažuriran UserProfile interfejs da koristi niz stringova za education
export interface UserProfile {
    bio: string | null;
    jobTitle: string | null;
    education: string[] | null;
    // Ažurirani tip za lokaciju:
    location: { 
        latitude?: number; 
        longitude?: number; 
        locationCity?: string; 
        locationCountry?: string 
    } | null;
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
}

interface ProfileContextType {
  profile: UserProfile;
  loadProfile: (data: UserProfile) => void;
  setProfileField: <T extends keyof UserProfile>(
    field: T,
    value: UserProfile[T]
  ) => void;
  resetProfile: () => void;
}

const defaultProfile: UserProfile = {
  bio: null,
  jobTitle: null,
  education: null,
  location: null,
  showLocation: true,
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

const ProfileContext = createContext<ProfileContextType | undefined>(
  undefined
);

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfileState] = useState<UserProfile>(defaultProfile);

  const loadProfile = useCallback((data: UserProfile) => {
    setProfileState(data);
  }, []);

  const setProfileField = useCallback(
    <T extends keyof UserProfile>(field: T, value: UserProfile[T]) => {
      setProfileState((prevProfile) => ({
        ...prevProfile,
        [field]: value,
      }));
    },
    []
  );

  const resetProfile = useCallback(() => {
    setProfileState(defaultProfile);
  }, []);

  return (
    <ProfileContext.Provider
      value={{ profile, loadProfile, setProfileField, resetProfile }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

// Ključna izmena: promenjeno ime funkcije iz 'useProfile' u 'useProfileContext'
export const useProfileContext = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfileContext must be used within a ProfileProvider');
  }
  return context;
};