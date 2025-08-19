"use client";

import React, { useState, useEffect } from 'react';
import { fetchUserAttributes, updateUserAttributes } from 'aws-amplify/auth';
import { useAuth } from './AuthProvider';

interface UserProfileProps {
  onBack: () => void;
}

interface UserAttributes {
  email?: string;
  nickname?: string;
  preferred_username?: string;
}

export default function UserProfile({ onBack }: UserProfileProps) {
  const { user, signOut } = useAuth();
  const [attributes, setAttributes] = useState<UserAttributes>({});
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    nickname: '',
    preferred_username: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadUserAttributes();
  }, []);

  const loadUserAttributes = async () => {
    try {
      setIsLoading(true);
      const userAttributes = await fetchUserAttributes();
      setAttributes(userAttributes);
      setEditForm({
        nickname: userAttributes.nickname || '',
        preferred_username: userAttributes.preferred_username || '',
      });
    } catch (error) {
      console.error('Error loading user attributes:', error);
      setError('Nie udało się załadować danych profilu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editForm.nickname || editForm.nickname.length < 3) {
      setError('Nick musi mieć co najmniej 3 znaki');
      return;
    }

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      await updateUserAttributes({
        userAttributes: {
          nickname: editForm.nickname,
          preferred_username: editForm.preferred_username || editForm.nickname,
        },
      });

      setSuccess('Profil został zaktualizowany');
      setIsEditing(false);
      loadUserAttributes();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setError('Nie udało się zaktualizować profilu');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="profile-screen">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Ładowanie profilu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-screen">
      <div className="screen-header">
        <button className="back-button" onClick={onBack}>
          ← Powrót
        </button>
        <h1 className="screen-title">Profil</h1>
      </div>

      <div className="profile-content">
        <div className="profile-card">
          <div className="profile-avatar">
            <div className="avatar-placeholder">
              {attributes.nickname?.charAt(0)?.toUpperCase() || '?'}
            </div>
          </div>

          {!isEditing ? (
            <div className="profile-info">
              <h2 className="profile-nickname">
                {attributes.nickname || 'Brak nicku'}
              </h2>
              <p className="profile-email">{attributes.email}</p>

              {attributes.preferred_username && (
                <p className="profile-preferred">
                  Wyświetlany jako: {attributes.preferred_username}
                </p>
              )}

              <div className="profile-actions">
                <button
                  className="action-button secondary"
                  onClick={() => setIsEditing(true)}
                >
                  Edytuj profil
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="profile-edit-form">
              <div className="form-group">
                <label htmlFor="nickname" className="form-label">
                  Nick gracza
                </label>
                <input
                  id="nickname"
                  type="text"
                  value={editForm.nickname}
                  onChange={(e) => setEditForm({...editForm, nickname: e.target.value})}
                  className="form-input"
                  placeholder="TwójNick"
                  required
                  minLength={3}
                  maxLength={20}
                  disabled={isSaving}
                />
              </div>

              <div className="form-group">
                <label htmlFor="preferred_username" className="form-label">
                  Wyświetlana nazwa (opcjonalne)
                </label>
                <input
                  id="preferred_username"
                  type="text"
                  value={editForm.preferred_username}
                  onChange={(e) => setEditForm({...editForm, preferred_username: e.target.value})}
                  className="form-input"
                  placeholder="Pozostaw puste aby użyć nicku"
                  maxLength={20}
                  disabled={isSaving}
                />
              </div>

              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              {success && (
                <div className="success-message">
                  {success}
                </div>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  className="action-button tertiary"
                  onClick={() => {
                    setIsEditing(false);
                    setError('');
                    setSuccess('');
                  }}
                  disabled={isSaving}
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="action-button primary"
                  disabled={isSaving}
                >
                  {isSaving ? 'Zapisywanie...' : 'Zapisz'}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="profile-stats">
          <div className="stat-item">
            <span className="stat-label">Rozegrane gry</span>
            <span className="stat-value">0</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Wygrane</span>
            <span className="stat-value">0</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Ranking</span>
            <span className="stat-value">-</span>
          </div>
        </div>

        <div className="profile-actions-bottom">
          <button
            className="action-button danger"
            onClick={handleSignOut}
          >
            Wyloguj się
          </button>
        </div>
      </div>
    </div>
  );
}
