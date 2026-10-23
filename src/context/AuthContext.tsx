import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserSession } from '../types';

interface AuthContextType {
  user: UserSession | null;
  isAuthenticated: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  quickLogin: (role: 'Super Admin' | 'Fleet Manager' | 'Port Agent' | 'Chief Superintendent') => void;
}

const AUTH_STORAGE_KEY = 'samudera_auth_session';

const defaultUsers: Record<string, { user: UserSession; password: string; username: string }> = {
  'admin@samudera-logistics.co.id': {
    username: 'admin',
    password: 'admin123',
    user: {
      id: 'usr-1',
      name: 'Capt. R. Soedirman, M.Mar',
      email: 'admin@samudera-logistics.co.id',
      role: 'Super Admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    }
  },
  'ops.manager@samudera-logistics.co.id': {
    username: 'ops_manager',
    password: 'ops123',
    user: {
      id: 'usr-2',
      name: 'Budi Santoso, S.T.',
      email: 'ops.manager@samudera-logistics.co.id',
      role: 'Fleet Manager',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
    }
  },
  'port.agent@samudera-logistics.co.id': {
    username: 'port_agent',
    password: 'port123',
    user: {
      id: 'usr-3',
      name: 'Siti Aminah, S.Kom',
      email: 'port.agent@samudera-logistics.co.id',
      role: 'Port Agent',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
    }
  },
  'superintendent@samudera-logistics.co.id': {
    username: 'tech_super',
    password: 'tech123',
    user: {
      id: 'usr-4',
      name: 'Ir. Hendra Gunawan',
      email: 'superintendent@samudera-logistics.co.id',
      role: 'Chief Superintendent',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
    }
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to restore auth session', e);
    }
    // Default to Super Admin for immediate instant view, but can be logged out anytime
    return defaultUsers['admin@samudera-logistics.co.id'].user;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [user]);

  const login = async (usernameOrEmail: string, password: string): Promise<{ success: boolean; message?: string }> => {
    // Simulating authentication latency
    await new Promise(res => setTimeout(res, 400));

    const cleanInput = usernameOrEmail.trim().toLowerCase();

    // Check by email or username
    for (const key in defaultUsers) {
      const account = defaultUsers[key];
      if (
        (account.user.email.toLowerCase() === cleanInput || account.username.toLowerCase() === cleanInput) &&
        account.password === password
      ) {
        setUser(account.user);
        return { success: true };
      }
    }

    // Allow custom login if password meets minimum length
    if (password.length >= 6 && cleanInput.length >= 3) {
      const isEmail = cleanInput.includes('@');
      const newUser: UserSession = {
        id: 'usr-custom-' + Date.now(),
        name: cleanInput.split('@')[0].toUpperCase(),
        email: isEmail ? cleanInput : `${cleanInput}@samudera-logistics.co.id`,
        role: 'Fleet Manager'
      };
      setUser(newUser);
      return { success: true };
    }

    return { 
      success: false, 
      message: 'Kombinasi email/username dan password tidak valid. Cek kredensial demo di bawah.' 
    };
  };

  const quickLogin = (role: 'Super Admin' | 'Fleet Manager' | 'Port Agent' | 'Chief Superintendent') => {
    const found = Object.values(defaultUsers).find(item => item.user.role === role);
    if (found) {
      setUser(found.user);
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        quickLogin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
