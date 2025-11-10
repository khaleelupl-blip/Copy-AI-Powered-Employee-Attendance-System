import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import LoginPage from './components/pages/LoginPage';
import Dashboard from './components/pages/Dashboard';

const AppContent: React.FC = () => {
  const { user } = useAuth();

  return user ? <Dashboard /> : <LoginPage />;
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
          <AppProvider>
              <AuthProvider>
                  <AppContent />
              </AuthProvider>
          </AppProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;