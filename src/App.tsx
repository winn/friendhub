import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { Bot, MessageSquare, Users, CreditCard, LogOut, Coins, Plus, Sparkles, Zap } from 'lucide-react';
import { AuthModal } from './components/AuthModal';
import { ChatWindow } from './components/ChatWindow';
import { CreateAgentForm } from './components/CreateAgentForm';
import { Marketplace } from './components/Marketplace';
import { MyAgents } from './components/MyAgents';
import { PointsStore } from './components/PointsStore';
import { SuccessNotification } from './components/SuccessNotification';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { TermsOfService } from './components/TermsOfService';
import { LogoPreview } from './components/LogoPreview';
import { Logo } from './components/Logo';
import { LanguageSwitch } from './components/LanguageSwitch';
import { useLanguage } from './contexts/LanguageContext';
import { usePoints } from './hooks/usePoints';
import { supabase } from './lib/supabase';
import type { User } from '@supabase/supabase-js';

export default function App() {
  const { t } = useLanguage();
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPointsStoreOpen, setIsPointsStoreOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [showCreateAgent, setShowCreateAgent] = useState(false);
  const [showMyAgents, setShowMyAgents] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { points, loading: pointsLoading, refetchPoints } = usePoints(user?.id || null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        localStorage.setItem('userId', session.user.id);
      }
    });

    const storedAgentId = localStorage.getItem('selectedAgentId');
    if (storedAgentId) {
      setShowChat(true);
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        localStorage.setItem('userId', currentUser.id);
      } else {
        localStorage.removeItem('userId');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Check for payment status from URL parameters
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment_status');
    const points = params.get('points');
    
    if (paymentStatus === 'success' && points) {
      setSuccessMessage(`Successfully added ${points} points to your account! 🎉`);
      refetchPoints();
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (paymentStatus === 'cancelled') {
      setSuccessMessage('Payment cancelled. No points were added.');
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [refetchPoints]);

  const handleSignOut = async () => {
    try {
      // First clear all local storage items
      localStorage.clear();
      
      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Update UI state
      setUser(null);
      setShowChat(false);
      setShowCreateAgent(false);
      setShowMyAgents(false);
      
    } catch (error) {
      console.error('Error signing out:', error);
      // Force clear session even if there's an error
      localStorage.clear();
      setUser(null);
    }
  };

  const handleSelectAgent = (agentId: string) => {
    setShowChat(true);
  };

  const handleBackFromChat = () => {
    setShowChat(false);
    localStorage.removeItem('selectedAgentId');
    localStorage.removeItem('selectedAgentName');
    localStorage.removeItem('selectedAgentImage');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-fun-blue via-fun-mint to-fun-yellow relative overflow-hidden">
      <div className="fun-pattern absolute inset-0"></div>
      
      <Routes>
        <Route path="/privacy-policy" element={<PrivacyPolicy onBack={() => window.history.back()} />} />
        <Route path="/terms-of-service" element={<TermsOfService onBack={() => window.history.back()} />} />
        <Route path="/logo" element={<LogoPreview />} />
        <Route path="/logo-preview" element={<Navigate to="/logo" replace />} />
        <Route path="/" element={
          <>
            {/* Header */}
            <header className="relative">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                  <Link to="/" className="flex items-center space-x-3">
                    <Logo />
                  </Link>
                  <div className="flex flex-wrap items-center gap-3">
                    <LanguageSwitch />
                    {user ? (
                      <>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="badge-fun flex items-center space-x-1">
                            <span className="text-fun-blue font-medium truncate max-w-[150px]">{user.email}</span>
                          </div>
                          <button
                            onClick={() => setIsPointsStoreOpen(true)}
                            className="badge-fun flex items-center space-x-1 hover:scale-105 transition-transform cursor-pointer"
                          >
                            <Coins className="h-4 w-4 text-fun-yellow bounce-fun" />
                            <span className="font-medium text-fun-blue">
                              {pointsLoading ? '...' : points} {t('points')}
                            </span>
                          </button>
                        </div>
                        <button
                          onClick={handleSignOut}
                          className="btn-fun px-4 sm:px-6 py-2 text-white font-medium rounded-full flex items-center space-x-2"
                        >
                          <LogOut className="h-4 w-4" />
                          <span className="hidden sm:inline">{t('signout')}</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setAuthMode('signin');
                            setIsAuthModalOpen(true);
                          }}
                          className="btn-fun px-4 sm:px-6 py-2 text-white font-medium rounded-full"
                        >
                          {t('signin')}
                        </button>
                        <button
                          onClick={() => {
                            setAuthMode('signup');
                            setIsAuthModalOpen(true);
                          }}
                          className="btn-fun px-4 sm:px-6 py-2 text-white font-medium rounded-full flex items-center space-x-2"
                        >
                          <Sparkles className="h-4 w-4" />
                          <span>{t('signup')}</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 relative">
              {showChat && user ? (
                <ChatWindow 
                  userId={user.id}
                  onPointsUpdate={refetchPoints}
                  onBack={handleBackFromChat}
                />
              ) : showCreateAgent && user ? (
                <CreateAgentForm 
                  userId={user.id}
                  onBack={() => {
                    setShowCreateAgent(false);
                    setShowMyAgents(true);
                  }}
                />
              ) : showMyAgents && user ? (
                <MyAgents
                  userId={user.id}
                  onSelectAgent={handleSelectAgent}
                  onCreateNew={() => {
                    setShowMyAgents(false);
                    setShowCreateAgent(true);
                  }}
                  onBack={() => setShowMyAgents(false)}
                />
              ) : (
                <>
                  {/* Hero Section */}
                  <div className="text-center mb-12">
                    <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                      {t('hero_title')}
                    </h1>
                    <p className="text-xl text-white/80">
                      {t('hero_subtitle')}
                    </p>
                  </div>

                  {/* Action Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8 mb-12">
                    {/* My AI Squad Card */}
                    <div className="fun-card p-6 sm:p-8 transform hover:scale-105 transition-all duration-300">
                      <div className="flex items-center space-x-3 mb-4">
                        <Bot className="h-8 w-8 text-fun-blue float-animation" />
                        <h2 className="text-xl font-bold text-fun-blue">{t('my_ai_squad')}</h2>
                      </div>
                      <p className="text-gray-600 mb-6">
                        {t('squad_description')}
                      </p>
                      <button
                        onClick={() => user ? setShowMyAgents(true) : setIsAuthModalOpen(true)}
                        className="btn-fun w-full py-3 text-white font-medium rounded-full flex items-center justify-center space-x-2"
                      >
                        <Users className="h-5 w-5" />
                        <span>{user ? t('view_squad') : t('join_message')}</span>
                      </button>
                    </div>

                    {/* Points Card */}
                    <div className="fun-card p-6 sm:p-8 transform hover:scale-105 transition-all duration-300">
                      <div className="flex items-center space-x-3 mb-4">
                        <Coins className="h-8 w-8 text-fun-yellow bounce-fun" />
                        <h2 className="text-xl font-bold text-fun-yellow">{t('points')}</h2>
                      </div>
                      <p className="text-gray-600 mb-6">
                        {t('points_description')}
                      </p>
                      <button
                        onClick={() => user ? setIsPointsStoreOpen(true) : setIsAuthModalOpen(true)}
                        className="btn-fun w-full py-3 text-white font-medium rounded-full flex items-center justify-center space-x-2"
                      >
                        <Zap className="h-5 w-5" />
                        <span>{user ? t('get_points') : t('get_started')}</span>
                      </button>
                    </div>

                    {/* Create Friend Card */}
                    <div className="fun-card p-6 sm:p-8 transform hover:scale-105 transition-all duration-300">
                      <div className="flex items-center space-x-3 mb-4">
                        <Sparkles className="h-8 w-8 text-fun-mint float-animation" />
                        <h2 className="text-xl font-bold text-fun-mint">{t('create_friend')}</h2>
                      </div>
                      <p className="text-gray-600 mb-6">
                        {t('create_description')}
                      </p>
                      <button
                        onClick={() => user ? setShowCreateAgent(true) : setIsAuthModalOpen(true)}
                        className="btn-fun w-full py-3 text-white font-medium rounded-full flex items-center justify-center space-x-2"
                      >
                        <Plus className="h-5 w-5" />
                        <span>{user ? t('create_friend') : t('join_message')}</span>
                      </button>
                    </div>
                  </div>

                  {/* Marketplace Section */}
                  <section className="relative">
                    <div className="text-center mb-8">
                      <h2 className="text-3xl font-bold text-white mb-3">
                        {t('marketplace_title')}
                      </h2>
                      <p className="text-xl text-white/80">
                        {t('marketplace_subtitle')}
                      </p>
                    </div>
                    
                    {user ? (
                      <Marketplace onSelectAgent={handleSelectAgent} />
                    ) : (
                      <div className="fun-card p-12 text-center">
                        <Bot className="h-16 w-16 text-fun-blue mx-auto mb-6 bounce-fun" />
                        <h3 className="text-2xl font-bold text-fun-blue mb-4">
                          {t('join_fun')}
                        </h3>
                        <p className="text-gray-600 mb-8 text-lg">
                          {t('join_message')}
                        </p>
                        <button
                          onClick={() => setIsAuthModalOpen(true)}
                          className="btn-fun px-8 py-4 text-white font-medium rounded-full inline-flex items-center space-x-2 text-lg"
                        >
                          <Sparkles className="h-5 w-5" />
                          <span>{t('get_started')}</span>
                        </button>
                      </div>
                    )}
                  </section>

                  {/* Footer Links */}
                  <footer className="mt-12 text-center">
                    <div className="space-x-4 text-white/80">
                      <Link to="/privacy-policy" className="hover:text-white">
                        {t('privacy_policy')}
                      </Link>
                      <Link to="/terms-of-service" className="hover:text-white">
                        {t('terms_of_service')}
                      </Link>
                    </div>
                  </footer>
                </>
              )}
            </main>

            <AuthModal
              isOpen={isAuthModalOpen}
              onClose={() => setIsAuthModalOpen(false)}
              mode={authMode}
            />

            {user && isPointsStoreOpen && (
              <PointsStore
                userId={user.id}
                onClose={() => setIsPointsStoreOpen(false)}
                onSuccess={refetchPoints}
              />
            )}

            {successMessage && (
              <SuccessNotification
                message={successMessage}
                onClose={() => setSuccessMessage(null)}
              />
            )}
          </>
        } />
      </Routes>
    </div>
  );
}