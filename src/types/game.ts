/**
 * Game domain types for Pies Card Game
 */

export type GameStatus = 'lobby' | 'playing' | 'finished';
export type GamePhase = 'setup' | 'playing' | 'round_end';
export type CardSuit = 'C' | 'D' | 'H' | 'S'; // Clubs, Diamonds, Hearts, Spades
export type CardRank = 9 | 10 | 'J' | 'Q' | 'K' | 'A';
export type MessageType = 'text' | 'emoji' | 'system';

export interface Card {
  suit: CardSuit;
  rank: CardRank;
}

export interface PlayerSeat {
  userId?: string;
  displayName?: string;
  seat: number; // 0-3
  color?: CardSuit; // Assigned after Dame Trefl played
  connected: boolean;
  lastSeen: string;
}

export interface Game {
  id: string;
  code: string;
  status: GameStatus;
  hostUserId: string;
  seats: PlayerSeat[];
  turnSeat?: number; // Current player's seat (0-3)
  phase: GamePhase;
  assignedColors: boolean; // True after Dame Trefl played
  tableCards: Card[];
  budaOwnerSeat?: number; // Who took the last Buda
  currentRound: number;
  winnerOrder: string[]; // UserIds in order of finishing
  version: number; // For optimistic locking
  createdAt: string;
  updatedAt: string;
}

export interface GameHand {
  id: string;
  gameId: string;
  seat: number;
  cards: Card[];
}

export interface ChatMessage {
  id: string;
  gameId: string;
  userId: string;
  message: string;
  type: MessageType;
  createdAt: string;
}

export interface GameEvent {
  id: string;
  gameId: string;
  type: string;
  payload?: any;
  userId?: string;
  createdAt: string;
}

// API Response types
export interface CreateGameInput {
  name?: string;
  isPublic?: boolean;
}

export interface JoinGameInput {
  code: string;
}

export interface PlayCardInput {
  gameId: string;
  card: Card;
  secondCard?: Card;
}

export interface TakeBudaInput {
  gameId: string;
}

export interface HeartbeatInput {
  gameId: string;
}

export interface PresenceAck {
  gameId: string;
  userId: string;
  timestamp: string;
  connectedPlayers: number;
}

// Subscription payloads
export interface GameUpdatedPayload {
  game: Game;
  event: string;
  userId?: string;
}

export interface PlayerJoinedPayload {
  game: Game;
  player: PlayerSeat;
}

export interface ChatMessagePayload {
  message: ChatMessage;
}

// UI State types
export interface GameUIState {
  selectedCard?: Card;
  selectedSecondCard?: Card;
  showConfirmDialog: boolean;
  isMyTurn: boolean;
  canTakeBuda: boolean;
  possibleMoves: Card[];
}

// Helper functions
export const isCardEqual = (a: Card, b: Card): boolean => {
  return a.suit === b.suit && a.rank === b.rank;
};

export const getCardValue = (card: Card): number => {
  switch (card.rank) {
    case 9: return 9;
    case 10: return 10;
    case 'J': return 11;
    case 'Q': return 12;
    case 'K': return 13;
    case 'A': return 14;
    default: return 0;
  }
};

export const getCardDisplayName = (card: Card): string => {
  const suitNames: Record<CardSuit, string> = {
    'C': '♣', // Clubs (Trefl)
    'D': '♦', // Diamonds (Karo)
    'H': '♥', // Hearts (Kier)
    'S': '♠', // Spades (Pik)
  };

  return `${card.rank}${suitNames[card.suit]}`;
};

export const getSuitDisplayName = (suit: CardSuit): string => {
  const suitNames: Record<CardSuit, string> = {
    'C': 'Trefl',
    'D': 'Karo', 
    'H': 'Kier',
    'S': 'Pik',
  };

  return suitNames[suit];
};
