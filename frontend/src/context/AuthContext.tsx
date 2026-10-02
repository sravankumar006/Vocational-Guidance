import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '@/types';
import { authService } from '@/services/authService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (identifier?: string, password?: string, role?: UserRole) => Promise<User>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(authService.getCurrentUser());
  const [token, setToken] = useState<string | null>(authService.getToken());
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function verifyAuth() {
      if (authService.getToken()) {
        const verifiedUser = await authService.fetchMe();
        if (verifiedUser) {
          setUser(verifiedUser);
        } else {
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    }
    verifyAuth();
  }, []);

  const login = useCallback(async (identifier?: string, password?: string, role?: UserRole) => {
    setLoading(true);
    try {
      const response = await authService.login(identifier, password, role);
      setUser(response.user);
      setToken(response.access_token);
      return response.user;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const switchRole = useCallback(async (role: UserRole) => {
    return login(undefined, undefined, role);
  }, [login]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user && !!token,
        login,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
