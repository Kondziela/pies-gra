'use client';

import React, { useState } from 'react';
import { signOut } from 'aws-amplify/auth';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export const UserProfile: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      router.push('/auth');
    } catch (error) {
      console.error('Błąd podczas wylogowywania:', error);
    } finally {
      setIsSigningOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-600 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Profil użytkownika</h2>
        <span className="text-green-400 text-sm">●  Online</span>
      </div>

      <div className="space-y-2 mb-4">
        <div>
          <span className="text-gray-400 text-sm">Imię:</span>
          <p className="text-white">{user.signInDetails?.loginId || 'Nieznane'}</p>
        </div>
        <div>
          <span className="text-gray-400 text-sm">Email:</span>
          <p className="text-white">{user.username}</p>
        </div>
        <div>
          <span className="text-gray-400 text-sm">ID użytkownika:</span>
          <p className="text-white text-xs font-mono">{user.userId.substring(0, 8)}...</p>
        </div>
      </div>

      <button
        onClick={handleSignOut}
        disabled={isSigningOut}
        className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
      >
        {isSigningOut ? 'Wylogowywanie...' : 'Wyloguj się'}
      </button>
    </div>
  );
};
