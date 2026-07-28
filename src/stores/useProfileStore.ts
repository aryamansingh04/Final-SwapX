import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface TimeSlot {
  start: string;
  end: string;
}

export interface DayAvailability {
  enabled: boolean;
  slots: TimeSlot[];
}

export interface WeeklyAvailability {
  monday: DayAvailability;
  tuesday: DayAvailability;
  wednesday: DayAvailability;
  thursday: DayAvailability;
  friday: DayAvailability;
  saturday: DayAvailability;
  sunday: DayAvailability;
  timezone: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  occupation?: string;
  skills: string[];
  skillsToLearn: string[];
  bio?: string;
  location?: string;
  github?: string;
  linkedin?: string;
  availability?: WeeklyAvailability;
  createdAt: string;
  updatedAt: string;
}

interface ProfileState {
  profiles: Record<string, UserProfile>; 
  getProfile: (userId: string) => UserProfile | null;
  setProfile: (profile: UserProfile) => void;
  updateProfile: (userId: string, updates: Partial<Omit<UserProfile, 'id' | 'email' | 'createdAt'>>) => void;
  deleteProfile: (userId: string) => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profiles: {},
      
      getProfile: (userId: string) => {
        const state = get();
        return state.profiles[userId] || null;
      },
      
      setProfile: (profile: UserProfile) => {
        set((state) => ({
          profiles: {
            ...state.profiles,
            [profile.id]: profile,
          },
        }));
      },
      
      updateProfile: (userId: string, updates: Partial<Omit<UserProfile, 'id' | 'email' | 'createdAt'>>) => {
        set((state) => {
          const existingProfile = state.profiles[userId];
          if (!existingProfile) {
            return state;
          }
          
          return {
            profiles: {
              ...state.profiles,
              [userId]: {
                ...existingProfile,
                ...updates,
                updatedAt: new Date().toISOString(),
              },
            },
          };
        });
      },
      
      deleteProfile: (userId: string) => {
        set((state) => {
          const newProfiles = { ...state.profiles };
          delete newProfiles[userId];
          return { profiles: newProfiles };
        });
      },
    }),
    {
      name: 'profile-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        profiles: state.profiles,
      }),
    }
  )
);

