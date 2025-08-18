import type { AppSyncResolverHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { ulid } from 'ulid';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

interface CreateGameArgs {
  name?: string;
  isPublic?: boolean;
}

interface Game {
  id: string;
  code: string;
  status: 'lobby' | 'playing' | 'finished';
  hostUserId: string;
  seats: PlayerSeat[];
  turnSeat?: number;
  phase: 'setup' | 'playing' | 'round_end';
  assignedColors: boolean;
  tableCards: Card[];
  budaOwnerSeat?: number;
  currentRound: number;
  winnerOrder: string[];
  version: number;
  createdAt: string;
  updatedAt: string;
}

interface PlayerSeat {
  userId?: string;
  displayName?: string;
  seat: number;
  color?: 'C' | 'D' | 'H' | 'S'; // Clubs, Diamonds, Hearts, Spades
  connected: boolean;
  lastSeen: string;
}

interface Card {
  suit: 'C' | 'D' | 'H' | 'S';
  rank: 9 | 10 | 'J' | 'Q' | 'K' | 'A';
}

function generateGameCode(): string {
  // Generate 6-character alphanumeric code
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const handler: AppSyncResolverHandler<CreateGameArgs, Game> = async (event) => {
  console.log('CreateGame event:', JSON.stringify(event, null, 2));

  const { name, isPublic = false } = event.arguments;
  const userId = event.identity?.sub;

  if (!userId) {
    throw new Error('Unauthorized: User not authenticated');
  }

  const now = new Date().toISOString();
  const gameId = ulid();
  const gameCode = generateGameCode();

  // Initialize empty seats (4 slots)
  const seats: PlayerSeat[] = [
    { seat: 0, connected: false, lastSeen: now },
    { seat: 1, connected: false, lastSeen: now },
    { seat: 2, connected: false, lastSeen: now },
    { seat: 3, connected: false, lastSeen: now },
  ];

  // Host takes first available seat
  seats[0] = {
    userId,
    displayName: name || 'Host',
    seat: 0,
    connected: true,
    lastSeen: now,
  };

  const game: Game = {
    id: gameId,
    code: gameCode,
    status: 'lobby',
    hostUserId: userId,
    seats,
    phase: 'setup',
    assignedColors: false,
    tableCards: [],
    currentRound: 1,
    winnerOrder: [],
    version: 1,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await docClient.send(
      new PutCommand({
        TableName: process.env.GAME_TABLE_NAME,
        Item: game,
        ConditionExpression: 'attribute_not_exists(id)',
      })
    );

    console.log('Game created successfully:', gameId);
    return game;
  } catch (error) {
    console.error('Error creating game:', error);
    throw new Error('Failed to create game');
  }
};
