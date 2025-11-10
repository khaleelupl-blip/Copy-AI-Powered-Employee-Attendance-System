import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import * as api from '../services/api';

interface AppContextType {
  appName: string;
  appLogo: string | null;
  setAppName: (name: string) => void;
  setAppLogo: (logo: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [appName, setAppName] = useState('AttendancePro');
  const [appLogo, setAppLogo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await api.getAppSettings();
      setAppName(settings.appName);
      setAppLogo(settings.appLogo);
      setLoading(false);
    };
    loadSettings();
  }, []);

  return (
    <AppContext.Provider value={{ appName, appLogo, setAppName, setAppLogo }}>
      {!loading && children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};