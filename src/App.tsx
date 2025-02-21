import React, { useState, useEffect } from 'react';
import { Bot, MessageSquare, Users, CreditCard, LogOut, Coins, Plus, Sparkles, Zap } from 'lucide-react';
import { AuthModal } from './components/AuthModal';
import { ChatWindow } from './components/ChatWindow';
import { CreateAgentForm } from './components/CreateAgentForm';
import { Marketplace } from './components/Marketplace';
import { MyAgents } from './components/MyAgents';
import { PointsStore } from './components/PointsStore';
import { SuccessNotification } from './components/SuccessNotification';
import { supabase } from './lib/supabase';
import { usePoints } from './hooks/usePoints';
import type { User } from '@supabase/supabase-js';

function App() {
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
    setShowMyAgents(false);
  };

  const handleBackFromChat = () => {
    setShowChat(false);
    localStorage.removeItem('selectedAgentId');
    localStorage.removeItem('selectedAgentName');
    localStorage.removeItem('selectedAgentImage');
  };

  const formatPoints = (points: number | null | undefined) => {
    if (typeof points !== 'number') return '0';
    return points.toString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-fun-red via-fun-mint to-fun-yellow relative overflow-hidden">
      <div className="fun-pattern absolute inset-0"></div>
      
      {/* Header */}
      <header className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <Bot className="h-8 w-8 sm:h-10 sm:w-10 text-white glow-animation" />
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                AI Friends Hub 
                <span className="emoji-float ml-2">🚀</span>
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {user ? (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="badge-fun flex items-center space-x-1">
                      <span className="text-fun-red font-medium truncate max-w-[150px]">{user.email}</span>
                    </div>
                    <button
                      onClick={() => setIsPointsStoreOpen(true)}
                      className="badge-fun flex items-center space-x-1 hover:scale-105 transition-transform cursor-pointer"
                    >
                      <Coins className="h-4 w-4 text-fun-yellow bounce-fun" />
                      <span className="font-medium text-fun-red">
                        {pointsLoading ? '...' : formatPoints(points)} points
                      </span>
                    </button>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="btn-fun px-4 sm:px-6 py-2 text-white font-medium rounded-full flex items-center space-x-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">Sign Out</span>
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
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      setAuthMode('signup');
                      setIsAuthModalOpen(true);
                    }}
                    className="btn-fun px-4 sm:px-6 py-2 text-white font-medium rounded-full flex items-center space-x-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Join Now!</span>
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
            {/* Action Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8 mb-8 sm:mb-12">
              {/* My Agents Card */}
              <div className="fun-card p-6 sm:p-8">
                <div className="flex items-center space-x-3 mb-4 sm:mb-6">
                  <Bot className="h-6 w-6 sm:h-8 sm:w-8 text-fun-red float-animation" />
                  <h2 className="text-xl sm:text-2xl font-bold text-fun-red">My AI Squad</h2>
                </div>
                <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
                  Create and manage your own AI friends! Make them unique and awesome! ✨
                </p>
                <button
                  onClick={() => user ? setShowMyAgents(true) : setIsAuthModalOpen(true)}
                  className="btn-fun w-full py-2 sm:py-3 px-4 sm:px-6 text-white font-medium rounded-full flex items-center justify-center space-x-2 text-sm sm:text-base"
                >
                  <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>{user ? 'View My Squad' : 'Join to Create'}</span>
                </button>
              </div>

              {/* Points Card */}
              <div className="fun-card p-6 sm:p-8">
                <div className="flex items-center space-x-3 mb-4 sm:mb-6">
                  <Coins className="h-6 w-6 sm:h-8 sm:w-8 text-fun-yellow bounce-fun" />
                  <h2 className="text-xl sm:text-2xl font-bold text-fun-yellow">Power Points</h2>
                </div>
                <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
                  Get points to chat more! The more you chat, the more fun you have! 🌟
                </p>
                <button
                  onClick={() => user ? setIsPointsStoreOpen(true) : setIsAuthModalOpen(true)}
                  className="btn-fun w-full py-2 sm:py-3 px-4 sm:px-6 text-white font-medium rounded-full flex items-center justify-center space-x-2 text-sm sm:text-base"
                >
                  <Zap className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>{user ? 'Get More Points!' : 'Get Started'}</span>
                </button>
              </div>

              {/* Create Agent Card */}
              <div className="fun-card p-6 sm:p-8">
                <div className="flex items-center space-x-3 mb-4 sm:mb-6">
                  <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-fun-mint float-animation" />
                  <h2 className="text-xl sm:text-2xl font-bold text-fun-mint">Create Friend</h2>
                </div>
                <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
                  Design your perfect AI buddy! Give them a cool personality! 🎨
                </p>
                <button
                  onClick={() => user ? setShowCreateAgent(true) : setIsAuthModalOpen(true)}
                  className="btn-fun w-full py-2 sm:py-3 px-4 sm:px-6 text-white font-medium rounded-full flex items-center justify-center space-x-2 text-sm sm:text-base"
                >
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>{user ? 'Create New Friend' : 'Join to Create'}</span>
                </button>
              </div>
            </div>

            {/* Marketplace Section */}
            <section>
              <div className="flex items-center space-x-3 mb-6 sm:mb-8">
                <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-white glow-animation" />
                <h2 className="text-2xl sm:text-3xl font-bold text-white">
                  Available Friends 
                  <span className="emoji-float ml-2">✨</span>
                </h2>
              </div>
              
              {user ? (
                <Marketplace onSelectAgent={handleSelectAgent} />
              ) : (
                <div className="fun-card p-8 sm:p-12 text-center">
                  <Bot className="h-12 w-12 sm:h-16 sm:w-16 text-fun-red mx-auto mb-4 sm:mb-6 bounce-fun" />
                  <h3 className="text-xl sm:text-2xl font-bold text-fun-red mb-3 sm:mb-4">
                    Join the Fun! 
                    <span className="emoji-float ml-2">🎉</span>
                  </h3>
                  <p className="text-gray-600 mb-6 sm:mb-8 text-base sm:text-lg">
                    Create an account to chat with awesome AI friends!
                  </p>
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="btn-fun px-6 sm:px-8 py-3 sm:py-4 text-white font-medium text-base sm:text-lg rounded-full inline-flex items-center space-x-2"
                  >
                    <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>Get Started!</span>
                  </button>
                </div>
              )}
            </section>
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
    </div>
  );
}

export default App;