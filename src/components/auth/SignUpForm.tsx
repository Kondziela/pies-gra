'use client';

import React, { useState } from 'react';
import { signUp, confirmSignUp, type SignUpInput } from 'aws-amplify/auth';

interface SignUpFormProps {
  onSwitchToSignIn: () => void;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({ onSwitchToSignIn }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });
  const [confirmationCode, setConfirmationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'signup' | 'confirm'>('signup');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const signUpInput: SignUpInput = {
        username: formData.email,
        password: formData.password,
        options: {
          userAttributes: {
            email: formData.email,
            name: formData.name,
          },
        },
      };

      await signUp(signUpInput);
      setStep('confirm');
    } catch (err: any) {
      setError(err.message || 'Błąd podczas rejestracji');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await confirmSignUp({
        username: formData.email,
        confirmationCode,
      });
      onSwitchToSignIn();
    } catch (err: any) {
      setError(err.message || 'Błąd podczas potwierdzenia konta');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  if (step === 'confirm') {
    return (
      <form onSubmit={handleConfirmSignUp} className="space-y-4">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-white mb-2">Potwierdź swoje konto</h3>
          <p className="text-gray-300 text-sm">
            Wysłaliśmy kod potwierdzający na adres: {formData.email}
          </p>
        </div>

        <div>
          <label htmlFor="confirmationCode" className="block text-sm font-medium text-gray-300 mb-1">
            Kod potwierdzający
          </label>
          <input
            type="text"
            id="confirmationCode"
            value={confirmationCode}
            onChange={(e) => setConfirmationCode(e.target.value)}
            required
            className="w-full px-3 py-2 bg-white/10 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            placeholder="123456"
          />
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
        >
          {isLoading ? 'Potwierdzanie...' : 'Potwierdź konto'}
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={onSwitchToSignIn}
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            Wróć do logowania
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSignUp} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
          Imię
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          required
          className="w-full px-3 py-2 bg-white/10 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          placeholder="Twoje imię"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          required
          className="w-full px-3 py-2 bg-white/10 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          placeholder="twoj@email.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
          Hasło
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          required
          className="w-full px-3 py-2 bg-white/10 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          placeholder="••••••••"
        />
        <p className="text-gray-400 text-xs mt-1">
          Minimum 8 znaków, wielkie i małe litery, cyfry
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
      >
        {isLoading ? 'Rejestracja...' : 'Zarejestruj się'}
      </button>

      <div className="text-center">
        <button
          type="button"
          onClick={onSwitchToSignIn}
          className="text-blue-400 hover:text-blue-300 text-sm"
        >
          Masz już konto? Zaloguj się
        </button>
      </div>
    </form>
  );
};
