"use client";

import React, { useState } from 'react';
import { signIn, SignInInput } from 'aws-amplify/auth';

interface LoginScreenProps {
  onBack: () => void;
  onSwitchToSignUp: () => void;
  onLoginSuccess: () => void;
}

export default function LoginScreen({ onBack, onSwitchToSignUp, onLoginSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Wprowadź email i hasło');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const signInInput: SignInInput = {
        username: email,
        password: password,
      };

      await signIn(signInInput);
      onLoginSuccess();
    } catch (error: any) {
      console.error('Login error:', error);

      switch (error.name) {
        case 'NotAuthorizedException':
          setError('Nieprawidłowy email lub hasło');
          break;
        case 'UserNotConfirmedException':
          setError('Potwierdź swoje konto poprzez email przed zalogowaniem');
          break;
        case 'UserNotFoundException':
          setError('Użytkownik nie istnieje');
          break;
        default:
          setError('Wystąpił błąd podczas logowania. Spróbuj ponownie.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="screen-header">
        <button className="back-button" onClick={onBack}>
          ← Powrót
        </button>
        <h1 className="screen-title">Logowanie</h1>
      </div>

      <div className="auth-content">
        <form onSubmit={handleLogin} className="auth-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              placeholder="twoj@email.com"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Hasło
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="Wprowadź hasło"
              required
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="auth-button primary"
            disabled={isLoading}
          >
            {isLoading ? 'Logowanie...' : 'Zaloguj się'}
          </button>
        </form>

        <div className="auth-divider">
          <span>lub</span>
        </div>

        <button
          className="auth-button secondary"
          onClick={onSwitchToSignUp}
          disabled={isLoading}
        >
          Utwórz nowe konto
        </button>

        <button
          className="auth-link"
          onClick={() => {/* TODO: Implement forgot password */}}
          disabled={isLoading}
        >
          Zapomniałeś hasła?
        </button>
      </div>
    </div>
  );
}
