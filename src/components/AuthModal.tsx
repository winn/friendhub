import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';
import { X, Sparkles, Mail, Lock, User, AlertOctagon } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'signin' | 'signup';
}

export function AuthModal({ isOpen, onClose, mode: initialMode }: AuthModalProps) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [lastEmailCheck, setLastEmailCheck] = useState<number>(0);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Reset states when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setEmail('');
      setPassword('');
      setName('');
      setLastEmailCheck(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Debounced email check with rate limiting
  const checkEmailExists = async (email: string) => {
    // Don't check if email is empty or invalid
    if (!email || !email.includes('@')) return false;

    // Check rate limit (60 seconds between checks)
    const now = Date.now();
    const timeSinceLastCheck = now - lastEmailCheck;
    if (timeSinceLastCheck < 60000) {
      return false;
    }

    try {
      setIsCheckingEmail(true);
      setLastEmailCheck(now);

      const { data: existingUser } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: false
        }
      });
      
      // If we get here without an error, the email exists
      if (existingUser) {
        setError('This email is already registered. Please sign in instead.');
        return true;
      }
      
      return false;
    } catch (err: any) {
      console.error('Error checking email:', err);
      
      // Handle rate limit errors gracefully
      if (err.message?.includes('rate_limit')) {
        // Don't show rate limit errors to user, just skip the check
        return false;
      }
      
      // Handle other specific error cases
      if (err.message?.includes('Email not confirmed')) {
        setError('This email is already registered but not confirmed. Please check your email.');
        return true;
      }
      
      return false;
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        // Final email check before signup
        const emailExists = await checkEmailExists(email);
        if (emailExists) {
          setLoading(false);
          return;
        }

        // Proceed with signup
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name || undefined
            }
          }
        });

        if (signUpError) {
          // Handle specific signup errors
          if (signUpError.message.toLowerCase().includes('email already')) {
            setError('This email is already registered. Please sign in instead.');
            return;
          }
          throw signUpError;
        }

        onClose();
      } else {
        // Handle sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          if (signInError.message.toLowerCase().includes('invalid credentials')) {
            setError('Invalid email or password');
            return;
          }
          throw signInError;
        }

        onClose();
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  // Debounced email input handler
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    setError(null);
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

        <div className="flex items-center space-x-3 mb-8">
          <Sparkles className="h-8 w-8 text-primary-600 float-animation" />
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-fun-purple bg-clip-text text-transparent">
            {mode === 'signin' ? 'Welcome Back! ✨' : 'Join the Fun! 🚀'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {mode === 'signup' && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name (optional)
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-primary-400" />
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 w-full rounded-full border-2 border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all duration-300"
                  placeholder="What should we call you?"
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-primary-400" />
              <input
                type="email"
                id="email"
                required
                value={email}
                onChange={handleEmailChange}
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
              Password
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
              {loading ? 'Processing...' : 
               isCheckingEmail ? 'Checking...' : 
               mode === 'signin' ? 'Sign In' : 'Create Account'}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-fun-pink to-fun-purple opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>

          {mode === 'signup' ? (
            <p className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError(null);
                }}
                className="text-fun-red hover:text-fun-red/80 font-medium"
              >
                Sign in instead
              </button>
            </p>
          ) : (
            <p className="text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError(null);
                }}
                className="text-fun-red hover:text-fun-red/80 font-medium"
              >
                Create one now
              </button>
            </p>
          )}
        </form>
      </div>
    </div>
  );
}