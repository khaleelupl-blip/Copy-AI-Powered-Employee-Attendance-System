import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import type { User } from '../types';
import * as api from '../services/api';

interface AuthContextType {
  user: User | null;
  login: (username: string, pass: string, rememberMe: boolean) => Promise<User>;
  logout: () => void;
  updateUser: (updatedUserData: Partial<User>) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for a logged-in user in storage on initial load
    // Prioritize localStorage for persistence
    const persistentUser = localStorage.getItem('user');
    const sessionUser = sessionStorage.getItem('user');
    
    if (persistentUser) {
      setUser(JSON.parse(persistentUser));
    } else if (sessionUser) {
      setUser(JSON.parse(sessionUser));
    }
    setLoading(false);
  }, []);

  const login = async (username: string, pass: string, rememberMe: boolean) => {
    const loggedInUser = await api.loginUser(username, pass);
    setUser(loggedInUser);
    if (rememberMe) {
        localStorage.setItem('user', JSON.stringify(loggedInUser));
        sessionStorage.removeItem('user'); // Clean up session storage
    } else {
        sessionStorage.setItem('user', JSON.stringify(loggedInUser));
        localStorage.removeItem('user'); // Clean up local storage
    }
    return loggedInUser;
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('user');
    localStorage.removeItem('user'); // Clear both storages
    // We can also call an API logout endpoint here if needed
  };

  const updateUser = (updatedUserData: Partial<User>) => {
    if (user) {
        const newUser = { ...user, ...updatedUserData };
        setUser(newUser);
        // Update whichever storage is being used
        if (localStorage.getItem('user')) {
            localStorage.setItem('user', JSON.stringify(newUser));
        }
        if (sessionStorage.getItem('user')) {
            sessionStorage.setItem('user', JSON.stringify(newUser));
        }
    }
  };


  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};