import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import Spinner from '../shared/Spinner';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { t } = useLanguage();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password, rememberMe);
    } catch (err) {
      setError(t('login_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-sky-400 via-sky-500 to-indigo-600 p-4">
      <div className="w-full max-w-md">
        <div className="bg-black/20 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-12 border border-white/20 text-white">
            <div className="text-center mb-8">
                <i className="fas fa-fingerprint text-5xl text-white/80 mb-4"></i>
                <h1 className="text-3xl font-bold tracking-wider">{t('app_title')}</h1>
                <p className="text-white/70 mt-2">{t('sign_in_continue')}</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
                <div>
                    <label htmlFor="username" className="block text-sm font-medium text-white/80 text-left mb-1">
                        {t('username')}
                    </label>
                    <input 
                        id="username"
                        name="username"
                        type="text"
                        autoComplete="username"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg py-2.5 px-4 text-white placeholder-white/50 focus:ring-2 focus:ring-white/80 focus:outline-none transition-all"
                        placeholder="e.g. john.doe"
                    />
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-white/80 text-left mb-1">
                        {t('password')}
                    </label>
                    <input 
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg py-2.5 px-4 text-white placeholder-white/50 focus:ring-2 focus:ring-white/80 focus:outline-none transition-all"
                        placeholder="••••••••"
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <input
                            id="remember-me"
                            name="remember-me"
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="h-4 w-4 text-sky-400 focus:ring-sky-500 border-gray-300 rounded bg-white/20 cursor-pointer"
                        />
                        <label htmlFor="remember-me" className="ml-2 block text-sm text-white/80 cursor-pointer">
                            {t('remember_me')}
                        </label>
                    </div>
                </div>

                <div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full shadow-sm text-lg font-medium text-sky-600 bg-white hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/20 focus:ring-white transition-colors duration-300 disabled:opacity-70"
                    >
                        {loading ? <Spinner /> : t('sign_in')}
                    </button>
                </div>
            </form>

            {error && <p className="text-red-300 text-center mt-6 animate-pulse">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;