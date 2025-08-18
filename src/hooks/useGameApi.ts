'use client';

import { useState } from 'react';
import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../amplify/data/resource';
import type { CreateGameInput, JoinGameInput, Game } from '@/types/game';

const client = generateClient<Schema>();

export const useGameApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createGame = async (input: CreateGameInput): Promise<Game | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await client.mutations.createGame(input);
      return result.data as Game;
    } catch (err: any) {
      setError(err.message || 'Failed to create game');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const joinGame = async (input: JoinGameInput): Promise<Game | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await client.mutations.joinGame(input);
      return result.data as Game;
    } catch (err: any) {
      setError(err.message || 'Failed to join game');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getGame = async (id?: string, code?: string): Promise<Game | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await client.queries.getGame({ id, code });
      return result.data as Game;
    } catch (err: any) {
      setError(err.message || 'Failed to get game');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const listPublicGames = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await client.queries.listPublicGames({});
      return result.data;
    } catch (err: any) {
      setError(err.message || 'Failed to list games');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    createGame,
    joinGame,
    getGame,
    listPublicGames,
    loading,
    error,
  };
};
