'use client';

import { useState } from 'react';
import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../amplify/data/resource';
import type { Card, Game } from '@/types/game';

const client = generateClient<Schema>();

export const useGameEngine = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startGame = async (gameId: string): Promise<Game | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await client.mutations.startGame({ 
        gameId,
        action: 'start'
      });
      return result.data as Game;
    } catch (err: any) {
      setError(err.message || 'Failed to start game');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const playCard = async (gameId: string, card: Card, secondCard?: Card): Promise<Game | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await client.mutations.playCard({
        gameId,
        action: 'playCard',
        card,
        secondCard,
      });
      return result.data as Game;
    } catch (err: any) {
      setError(err.message || 'Failed to play card');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const takeBuda = async (gameId: string): Promise<Game | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await client.mutations.takeBuda({
        gameId,
        action: 'takeBuda',
      });
      return result.data as Game;
    } catch (err: any) {
      setError(err.message || 'Failed to take Buda');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    startGame,
    playCard,
    takeBuda,
    loading,
    error,
  };
};
