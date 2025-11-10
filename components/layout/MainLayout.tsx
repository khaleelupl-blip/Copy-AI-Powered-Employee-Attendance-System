import React, { useRef, useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { useLanguage } from '../../contexts/LanguageContext';
import * as api from '../../services/api';

interface MainLayoutProps {
  children: React.ReactNode;
  syncStatus: 'syncing' | 'synced' | 'error';
  lastSyncTime: string;
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return name.substring(0, 2).toUpperCase();
};


const LanguageSwitcher: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const { setLanguage } = useLanguage();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectLanguage = (lang: 'en' | 'es' | 'fr' | 'zh' | 'ur') => {
        setLanguage(lang);
        setIsOpen(false);
    }

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
            >
                <i className="fas fa-globe"></i>
            </button>
            {isOpen && (
                 <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 z-20">
                    <div className="py-1">
                        <a href="#" onClick={() => selectLanguage('en')} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">English</a>
                        <a href="#" onClick={() => selectLanguage('es')} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">Español</a>
                        <a href="#" onClick={() => selectLanguage('fr')} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">Français</a>
                        <a href="#" onClick={() => selectLanguage('zh')} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">中文 (Chinese)</a>
                        <a href="#" onClick={() => selectLanguage('ur')} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">اردو (Urdu)</a>
                    </div>
                </div>
            )}
        </div>
    )
}

const SyncIndicator: React.FC<{ status: 'syncing' | 'synced' | 'error', time: string }> = ({ status, time }) => {
    const { t } = useLanguage();

    const statusMap = {
        syncing: { icon: 'fa-spin fa-sync-alt', color: 'text-blue-500', text: t('syncing') },
        synced: { icon: 'fa-check-circle', color: 'text-green-500', text: t('synced_at', { time }) },
        error: { icon: 'fa-exclamation-triangle', color: 'text-red-500', text: t('sync_error') }
    };
    const { icon, color, text } = statusMap[status];

    return (
        <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 shadow-lg rounded-full py-2 px-4 flex items-center text-sm z-50 border dark:border-gray-700">
            <i className={`fas ${icon} ${color} mr-2`}></i>
            <span className="text-gray-600 dark:text-gray-300">{text}</span>
        </div>
    );
};

const MainLayout: React.FC<MainLayoutProps> = ({ children, syncStatus, lastSyncTime }) => {
  const { user, logout, updateUser } = useAuth();
  const { appName, appLogo } = useApp();
  const { t } = useLanguage();
  const profilePicInputRef = useRef<HTMLInputElement>(null);

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0] && user) {
          const file = e.target.files[0];
          try {
              const base64Photo = await fileToBase64(file);
              const updatedUser = { ...user, profilePhoto: base64Photo, password: '' };
              await api.updateEmployee(updatedUser);
              updateUser({ profilePhoto: base64Photo });
          } catch (error) {
              console.error("Failed to update profile picture", error);
              alert("Error updating profile picture. Please try a smaller image.");
          }
      }
  };

  const handleProfileClick = () => {
    profilePicInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-40 border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              {appLogo ? (
                 <img src={appLogo} alt="App Logo" className="h-8 w-auto mr-3" />
              ) : (
                <i className="fas fa-building text-2xl text-indigo-600 dark:text-indigo-400"></i>
              )}
              <span className="ml-3 font-bold text-xl text-gray-800 dark:text-white">{appName}</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="font-semibold text-gray-800 dark:text-white">{user?.fullName}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{t(`role_${user?.role}`)}</p>
              </div>
              <div className="relative group cursor-pointer" onClick={handleProfileClick}>
                {user?.profilePhoto ? (
                    <img className="h-10 w-10 rounded-full object-cover" src={user.profilePhoto} alt="User" />
                ) : (
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-500">
                        <span className="font-medium leading-none text-white">{getInitials(user?.fullName || '')}</span>
                    </span>
                )}
                 <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center rounded-full transition-opacity">
                    <i className="fas fa-camera text-white opacity-0 group-hover:opacity-100"></i>
                </div>
              </div>
              <input type="file" ref={profilePicInputRef} onChange={handleProfilePictureChange} className="hidden" accept="image/*" />
              
              <LanguageSwitcher />

              <button
                onClick={logout}
                className="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                aria-label={t('logout')}
              >
                <i className="fas fa-sign-out-alt"></i>
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
      <SyncIndicator status={syncStatus} time={lastSyncTime} />
    </div>
  );
};

export default MainLayout;
