import { createContext, useContext } from 'react';

export interface UserPresence {
  user_id: string;
  online_at: string;
  username?: string;
}

export interface PresenceContextType {
  onlineUsers: Map<string, UserPresence>;
  isUserOnline: (userId: string) => boolean;
  getUserPresence: (userId: string) => UserPresence | null;
}

export const PresenceContext = createContext<PresenceContextType | undefined>(undefined);

export const usePresence = (): PresenceContextType => {
  const context = useContext(PresenceContext);
  if (context === undefined) {
    throw new Error('usePresence must be used within a PresenceProvider');
  }
  return context;
};
