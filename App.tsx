import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import { LanguageProvider } from './contexts/LanguageContext';
import LoginPage from './components/pages/LoginPage';
import Dashboard from './components/pages/Dashboard';

const AppContent: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 antialiased">
      {user ? <Dashboard /> : <LoginPage />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
        <AppProvider>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </AppProvider>
    </LanguageProvider>
  );
};

export default App;
