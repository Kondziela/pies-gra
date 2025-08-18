'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  const handleAuthAction = () => {
    if (isAuthenticated) {
      router.push('/profile');
    } else {
      router.push('/auth');
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <div className="text-white text-lg">Ładowanie...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🐶 Pies</h1>
          <p className="text-gray-300">Gra karciana dla 4 graczy</p>
          {isAuthenticated && user && (
            <p className="text-blue-400 text-sm mt-2">
              Witaj, {user.signInDetails?.loginId || user.username}!
            </p>
          )}
        </div>

        <div className="space-y-4">
          {isAuthenticated ? (
            <>
              <button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                disabled
              >
                ➕ Nowa gra
              </button>
              <button 
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                disabled
              >
                🎮 Dołącz do gry
              </button>
              <button 
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                disabled
              >
                📖 Zasady gry
              </button>
              <button 
                onClick={handleAuthAction}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                👤 Profil
              </button>
            </>
          ) : (
            <>
              <button 
                className="w-full bg-gray-500 text-gray-300 font-semibold py-3 px-6 rounded-lg cursor-not-allowed"
                disabled
              >
                ➕ Nowa gra (wymagane logowanie)
              </button>
              <button 
                className="w-full bg-gray-500 text-gray-300 font-semibold py-3 px-6 rounded-lg cursor-not-allowed"
                disabled
              >
                🎮 Dołącz do gry (wymagane logowanie)
              </button>
              <button 
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                disabled
              >
                📖 Zasady gry
              </button>
              <button 
                onClick={handleAuthAction}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                🔐 Zaloguj się
              </button>
            </>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            Wersja rozwojowa - Faza 1 ukończona (Auth)
          </p>
        </div>
      </div>
    </main>
  );
}
