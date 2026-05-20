import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const ROLES = {
  CANDIDATE: 'CANDIDATE',
  INTERVIEWER: 'INTERVIEWER',
  ADMIN: 'ADMIN'
};

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null, // { id, name, email, role }
      login: (userData) => set({ user: userData }),
      logout: () => set({ user: null }),
    }),
    {
      name: 'auth-storage', // key in localStorage
    }
  )
);
