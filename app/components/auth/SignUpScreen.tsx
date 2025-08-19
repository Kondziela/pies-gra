"use client";

import React, { useState } from 'react';
import { signUp, SignUpInput, confirmSignUp } from 'aws-amplify/auth';

interface SignUpScreenProps {
  onBack: () => void;
  onSwitchToLogin: () => void;
  onSignUpSuccess: () => void;
}

export default function SignUpScreen({ onBack, onSwitchToLogin, onSignUpSuccess }: SignUpScreenProps) {
  const [step, setStep] = useState<'signup' | 'confirm'>('signup');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nickname: '',
  });
  const [confirmationCode, setConfirmationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password || !formData.nickname) {
      setError('Wypełnij wszystkie pola');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Hasła nie są identyczne');
      return;
    }

    if (formData.password.length < 8) {
      setError('Hasło musi mieć co najmniej 8 znaków');
      return;
    }

    if (formData.nickname.length < 3) {
      setError('Nick musi mieć co najmniej 3 znaki');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const signUpInput: SignUpInput = {
        username: formData.email,
        password: formData.password,
        options: {
          userAttributes: {
            nickname: formData.nickname,
          },
        },
      };

      await signUp(signUpInput);
      setStep('confirm');
    } catch (error: any) {
      console.error('SignUp error:', error);

      switch (error.name) {
        case 'UsernameExistsException':
          setError('Użytkownik z tym emailem już istnieje');
          break;
        case 'InvalidPasswordException':
          setError('Hasło nie spełnia wymagań bezpieczeństwa');
          break;
        case 'InvalidParameterException':
          setError('Nieprawidłowe dane. Sprawdź format email');
          break;
        default:
          setError('Wystąpił błąd podczas rejestracji. Spróbuj ponownie.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!confirmationCode || confirmationCode.length !== 6) {
      setError('Wprowadź 6-cyfrowy kod potwierdzający');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await confirmSignUp({
        username: formData.email,
        confirmationCode,
      });

      onSignUpSuccess();
    } catch (error: any) {
      console.error('Confirmation error:', error);

      switch (error.name) {
        case 'CodeMismatchException':
          setError('Nieprawidłowy kod potwierdzający');
          break;
        case 'ExpiredCodeException':
          setError('Kod wygasł. Poproś o nowy kod');
          break;
        default:
          setError('Wystąpił błąd podczas potwierdzania. Spróbuj ponownie.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'confirm') {
    return (
      <div className="auth-screen">
        <div className="screen-header">
          <button className="back-button" onClick={() => setStep('signup')}>
            ← Wstecz
          </button>
          <h1 className="screen-title">Potwierdź konto</h1>
        </div>

        <div className="auth-content">
          <div className="confirmation-info">
            <p>
              Wysłaliśmy kod potwierdzający na adres:
            </p>
            <strong>{formData.email}</strong>
          </div>

          <form onSubmit={handleConfirmSignUp} className="auth-form">
            <div className="form-group">
              <label htmlFor="confirmationCode" className="form-label">
                Kod potwierdzający
              </label>
              <input
                id="confirmationCode"
                type="text"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value)}
                className="form-input code-input"
                placeholder="123456"
                maxLength={6}
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
              {isLoading ? 'Potwierdzanie...' : 'Potwierdź konto'}
            </button>
          </form>

          <button
            className="auth-link"
            onClick={() => {/* TODO: Resend confirmation code */}}
            disabled={isLoading}
          >
            Nie otrzymałeś kodu? Wyślij ponownie
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-screen">
      <div className="screen-header">
        <button className="back-button" onClick={onBack}>
          ← Powrót
        </button>
        <h1 className="screen-title">Rejestracja</h1>
      </div>

      <div className="auth-content">
        <form onSubmit={handleSignUp} className="auth-form">
          <div className="form-group">
            <label htmlFor="nickname" className="form-label">
              Nick gracza
            </label>
            <input
              id="nickname"
              type="text"
              value={formData.nickname}
              onChange={(e) => setFormData({...formData, nickname: e.target.value})}
              className="form-input"
              placeholder="TwójNick"
              required
              minLength={3}
              maxLength={20}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
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
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="form-input"
              placeholder="Minimum 8 znaków"
              required
              minLength={8}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              Potwierdź hasło
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              className="form-input"
              placeholder="Powtórz hasło"
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
            {isLoading ? 'Tworzenie konta...' : 'Utwórz konto'}
          </button>
        </form>

        <div className="auth-divider">
          <span>lub</span>
        </div>

        <button
          className="auth-button secondary"
          onClick={onSwitchToLogin}
          disabled={isLoading}
        >
          Masz już konto? Zaloguj się
        </button>
      </div>
    </div>
  );
}
