import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile } from '../types';
import { useAuth } from './useAuth';

interface UserContextType {
  users: UserProfile[];
  activeUser: UserProfile | null;
  loading: boolean;
  switchUser: (userId: number) => void;
  createUser: (name: string, avatarColor: string) => Promise<UserProfile>;
  deleteUser: (userId: number) => Promise<void>;
  setActiveUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const ACTIVE_USER_KEY = 'deskpad_active_user_id';

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { token, profiles, refreshSession } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [activeUser, setActiveUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync users with auth context profiles and map snake_case to camelCase
  useEffect(() => {
    const mapped = profiles.map((p: any) => ({
      id: p.id,
      name: p.name,
      avatarColor: p.avatar_color || p.avatarColor || '#6366f1'
    }));
    setUsers(mapped);
    
    // Resolve active user from profiles
    const savedIdStr = localStorage.getItem(ACTIVE_USER_KEY);
    const savedId = savedIdStr ? parseInt(savedIdStr, 10) : null;
    
    const matched = mapped.find((u) => u.id === savedId);
    if (matched) {
      setActiveUser(matched);
    } else if (mapped.length === 1) {
      setActiveUser(mapped[0]);
      localStorage.setItem(ACTIVE_USER_KEY, String(mapped[0].id));
    } else {
      setActiveUser(null);
    }
    setLoading(false);
  }, [profiles]);

  const switchUser = useCallback((userId: number) => {
    const matched = users.find((u) => u.id === userId);
    if (matched) {
      setActiveUser(matched);
      localStorage.setItem(ACTIVE_USER_KEY, String(userId));
    }
  }, [users]);

  const createUser = useCallback(async (name: string, avatarColor: string): Promise<UserProfile> => {
    if (!token) throw new Error('Not authenticated');

    const response = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name, avatar_color: avatarColor }),
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.detail || 'Failed to create user profile');
    }

    const newUserDb = await response.json();
    const newUser: UserProfile = {
      id: newUserDb.id,
      name: newUserDb.name,
      avatarColor: newUserDb.avatar_color || newUserDb.avatarColor || avatarColor
    };
    await refreshSession(); // reload profiles list in useAuth
    return newUser;
  }, [token, refreshSession]);

  const deleteUser = useCallback(async (userId: number) => {
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`/api/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.detail || 'Failed to delete user profile');
    }

    await refreshSession(); // reload profiles list in useAuth
  }, [token, refreshSession]);

  return (
    <UserContext.Provider value={{ users, activeUser, loading, switchUser, createUser, deleteUser, setActiveUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
