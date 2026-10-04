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
  switchRole: (role: 'student' | 'parent') => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => authService.getCurrentUser());
  const [token, setToken] = useState<string | null>(() => authService.getToken());
  // If a user is already available in localStorage, do not block the UI on initial render
  const [loading, setLoading] = useState<boolean>(() => {
    const hasToken = !!authService.getToken();
    const hasUser = !!authService.getCurrentUser();
    return hasToken && !hasUser;
  });

  useEffect(() => {
    let isMounted = true;
    async function verifyAuth() {
      const currentToken = authService.getToken();
      if (currentToken) {
        try {
          const verifiedUser = await authService.fetchMe();
          if (isMounted) {
            if (verifiedUser) {
              setUser(verifiedUser);
            } else {
              setUser(null);
              setToken(null);
            }
          }
        } catch {
          // Graceful fallback to cached state
        }
      }
      if (isMounted) {
        setLoading(false);
      }
    }
    verifyAuth();
    return () => {
      isMounted = false;
    };
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

  const switchRole = useCallback(async (role: 'student' | 'parent') => {
    // Explicit guard: Only switching between parent and student is allowed.
    // Switching between administrator and others is strictly prohibited.
    if (role !== 'student' && role !== 'parent') {
      throw new Error('Role switching is only permitted between student and parent views.');
    }
    if (user?.role === 'admin') {
      throw new Error('Administrator accounts cannot switch views. Please log out first.');
    }
    return login(undefined, undefined, role);
  }, [login, user?.role]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
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
