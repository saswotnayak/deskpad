import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface AccountInfo {
  id: number;
  email: string;
}

export interface UserProfile {
  id: number;
  name: string;
  avatar_color: string;
}

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  account: AccountInfo | null;
  profiles: UserProfile[];
  loading: boolean;
  sendOtp: (email: string) => Promise<{ success: boolean; code?: string }>;
  verifyOtp: (email: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const TOKEN_KEY = 'deskpad_auth_token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem(TOKEN_KEY));
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    const currentToken = localStorage.getItem(TOKEN_KEY);
    if (!currentToken) {
      setToken(null);
      setAccount(null);
      setProfiles([]);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/session', {
        headers: {
          'Authorization': `Bearer ${currentToken}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAccount(data.account);
        setProfiles(data.profiles);
        setToken(currentToken);
      } else {
        // Token invalid/expired
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setAccount(null);
        setProfiles([]);
      }
    } catch (e) {
      console.error('Failed to verify session', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const sendOtp = useCallback(async (email: string) => {
    const response = await fetch('/api/auth/otp/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || 'Failed to send OTP code');
    }

    return response.json();
  }, []);

  const verifyOtp = useCallback(async (email: string, code: string) => {
    const response = await fetch('/api/auth/otp/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, code }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || 'Invalid or expired OTP code');
    }

    const data = await response.json();
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setAccount(data.account);
    await refreshSession();
  }, [refreshSession]);

  const logout = useCallback(async () => {
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (e) {
        console.error('Failed to logout on server', e);
      }
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('deskpad_active_user_id');
    setToken(null);
    setAccount(null);
    setProfiles([]);
  }, [token]);

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{
      token,
      isAuthenticated,
      account,
      profiles,
      loading,
      sendOtp,
      verifyOtp,
      logout,
      refreshSession
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
