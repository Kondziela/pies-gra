'use client';

import { useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../amplify/data/resource';
import type { Game, ChatMessage } from '@/types/game';

const client = generateClient<Schema>();

export const useGameSubscriptions = (gameId: string) => {
  const [game, setGame] = useState<Game | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (!gameId) return;

    // Subscribe to game updates
    const gameSubscription = client.subscriptions.onGameUpdated({ gameId }).subscribe({
      next: (data) => {
        if (data.data) {
          setGame(data.data as Game);
        }
      },
      error: (error) => {
        console.error('Game subscription error:', error);
      },
    });

    // Subscribe to chat messages
    const chatSubscription = client.subscriptions.onChatMessage({ gameId }).subscribe({
      next: (data) => {
        if (data.data) {
          const message = data.data as ChatMessage;
          setChatMessages(prev => [...prev, message]);
        }
      },
      error: (error) => {
        console.error('Chat subscription error:', error);
      },
    });

    // Cleanup subscriptions
    return () => {
      gameSubscription.unsubscribe();
      chatSubscription.unsubscribe();
    };
  }, [gameId]);

  return {
    game,
    chatMessages,
  };
};
