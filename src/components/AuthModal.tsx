import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';
import { X, Sparkles, Mail, Lock, User, AlertOctagon, CheckCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'signin' | 'signup';
}

export function AuthModal({ isOpen, onClose, mode: initialMode }: AuthModalProps) {
  const { t } = useLanguage();
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [lastEmailCheck, setLastEmailCheck] = useState<number>(0);
  const [signupSuccess, setSignupSuccess] = useState(false);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setEmail('');
      setPassword('');
      setName('');
      setLastEmailCheck(0);
      setSignupSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const checkEmailExists = async (email: string) => {
    if (!email || !email.includes('@')) return false;

    const now = Date.now();
    const timeSinceLastCheck = now - lastEmailCheck;
    if (timeSinceLastCheck < 60000) {
      return false;
    }

    try {
      setIsCheckingEmail(true);
      setLastEmailCheck(now);

      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (error) {
        console.error('Error checking email:', error);
        return false;
      }

      if (data) {
        setError(t('email_exists'));
        return true;
      }

      return false;
    } catch (err) {
      console.error('Error checking email:', err);
      return false;
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://aifriendhub.app/',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
      
      onClose();
    } catch (err) {
      console.error('Google login error:', err);
      setError(err instanceof Error ? err.message : t('error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        const emailExists = await checkEmailExists(email);
        if (emailExists) {
          setLoading(false);
          return;
        }

        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name || undefined
            },
            emailRedirectTo: 'https://aifriendhub.app/'
          }
        });

        if (signUpError) {
          if (signUpError.message.toLowerCase().includes('email already')) {
            setError(t('email_exists'));
            return;
          }
          throw signUpError;
        }

        setSignupSuccess(true);
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          if (signInError.message.toLowerCase().includes('invalid credentials')) {
            setError(t('invalid_credentials'));
            return;
          }
          throw signInError;
        }

        onClose();
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err instanceof Error ? err.message : t('error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="gradient-card max-w-md w-full p-8 relative rounded-2xl shadow-fun">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-primary-100 rounded-full transition-all duration-300"
        >
          <X className="h-5 w-5 text-primary-600" />
        </button>

        {error && (
          <div className="mb-6 text-center">
            <AlertOctagon className="h-12 w-12 text-fun-red mx-auto mb-3" />
            <div className="text-red-600 text-sm bg-red-50 p-4 rounded-xl">
              {error}
            </div>
          </div>
        )}

        {signupSuccess ? (
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-fun-mint mx-auto mb-4 bounce-fun" />
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {t('verification_sent')}
            </h3>
            <p className="text-gray-600 mb-6">
              {t('check_email')}
            </p>
            <button
              onClick={onClose}
              className="btn-fun px-6 py-3 text-white font-medium rounded-full"
            >
              {t('got_it')}
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center space-x-3 mb-8">
              <Sparkles className="h-8 w-8 text-primary-600 float-animation" />
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-fun-purple bg-clip-text text-transparent">
                {mode === 'signin' ? t('welcome_back') : t('join_fun')}
              </h2>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full mb-6 py-3 px-6 bg-white hover:bg-gray-50 text-gray-800 font-medium rounded-full border-2 border-gray-200 flex items-center justify-center space-x-3 transition-colors relative overflow-hidden group"
            >
              <img 
                src="https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png"
                alt="Google"
                className="w-5 h-5"
              />
              <span>{t('continue_with_google')}</span>
            </button>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 text-gray-500 bg-white">{t('or_continue_with_email')}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {mode === 'signup' && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('name')}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-primary-400" />
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 w-full rounded-full border-2 border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all duration-300"
                      placeholder={t('what_should_we_call_you')}
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('email')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-primary-400" />
                  <input
                    type="email"
                    id="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                    }}
                    onBlur={async (e) => {
                      if (mode === 'signup' && e.target.value) {
                        await checkEmailExists(e.target.value);
                      }
                    }}
                    className="pl-10 w-full rounded-full border-2 border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all duration-300"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('password')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-primary-400" />
                  <input
                    type="password"
                    id="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 w-full rounded-full border-2 border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all duration-300"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || isCheckingEmail || (mode === 'signup' && error !== null)}
                className="btn-fun w-full py-3 px-6 rounded-full text-white font-medium text-lg relative overflow-hidden group disabled:opacity-50"
              >
                <span className="relative z-10">
                  {loading ? t('processing') : 
                   isCheckingEmail ? t('checking') : 
                   mode === 'signin' ? t('signin') : t('create_account')}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-fun-pink to-fun-purple opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>

              {mode === 'signup' ? (
                <p className="text-center text-sm text-gray-600">
                  {t('already_have_account')}{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setError(null);
                    }}
                    className="text-fun-red hover:text-fun-red/80 font-medium"
                  >
                    {t('signin')}
                  </button>
                </p>
              ) : (
                <p className="text-center text-sm text-gray-600">
                  {t('dont_have_account')}{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setError(null);
                    }}
                    className="text-fun-red hover:text-fun-red/80 font-medium"
                  >
                    {t('create_account')}
                  </button>
                </p>
              )}
            </form>
          </>
        )}
      </div>
    </div>
  );
}