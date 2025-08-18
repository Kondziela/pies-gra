'use client';

import React, { useState } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignUpForm } from '@/components/auth/SignUpForm';

export default function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {mode === 'signin' ? 'Zaloguj się' : 'Zarejestruj się'}
          </h1>
          <p className="text-gray-300">
            {mode === 'signin' 
              ? 'Wpisz swoje dane aby zagrać w Pies' 
              : 'Utwórz konto aby rozpocząć grę'
            }
          </p>
        </div>

        {mode === 'signin' ? (
          <LoginForm onSwitchToSignUp={() => setMode('signup')} />
        ) : (
          <SignUpForm onSwitchToSignIn={() => setMode('signin')} />
        )}
      </div>
    </div>
  );
}
