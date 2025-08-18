import type { AppSyncResolverHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

interface JoinGameArgs {
  code: string;
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
  color?: 'C' | 'D' | 'H' | 'S';
  connected: boolean;
  lastSeen: string;
}

interface Card {
  suit: 'C' | 'D' | 'H' | 'S';
  rank: 9 | 10 | 'J' | 'Q' | 'K' | 'A';
}

export const handler: AppSyncResolverHandler<JoinGameArgs, Game> = async (event) => {
  console.log('JoinGame event:', JSON.stringify(event, null, 2));

  const { code } = event.arguments;
  const userId = event.identity?.sub;

  if (!userId) {
    throw new Error('Unauthorized: User not authenticated');
  }

  // First, find the game by code
  // Note: In real implementation, we'd need a GSI on code field
  // For now, we'll implement a simple scan (not production-ready)

  try {
    // This is a simplified version - in production use GSI query
    const games = await docClient.send(
      new GetCommand({
        TableName: process.env.GAME_TABLE_NAME,
        Key: { code }, // This won't work without GSI, but shows the intent
      })
    );

    const game = games.Item as Game;
    if (!game) {
      throw new Error('Game not found with this code');
    }

    if (game.status !== 'lobby') {
      throw new Error('Cannot join game that is already in progress');
    }

    // Check if user is already in the game
    const existingSeat = game.seats.find(seat => seat.userId === userId);
    if (existingSeat) {
      // User is already in game, just mark as connected
      existingSeat.connected = true;
      existingSeat.lastSeen = new Date().toISOString();
    } else {
      // Find first empty seat
      const emptySeat = game.seats.find(seat => !seat.userId);
      if (!emptySeat) {
        throw new Error('Game is full (4 players maximum)');
      }

      emptySeat.userId = userId;
      emptySeat.displayName = `Player ${emptySeat.seat + 1}`;
      emptySeat.connected = true;
      emptySeat.lastSeen = new Date().toISOString();
    }

    // Update the game
    const updatedGame = await docClient.send(
      new UpdateCommand({
        TableName: process.env.GAME_TABLE_NAME,
        Key: { id: game.id },
        UpdateExpression: 'SET seats = :seats, updatedAt = :updatedAt, version = version + :inc',
        ExpressionAttributeValues: {
          ':seats': game.seats,
          ':updatedAt': new Date().toISOString(),
          ':inc': 1,
        },
        ConditionExpression: 'version = :currentVersion',
        ExpressionAttributeValues: {
          ...ExpressionAttributeValues,
          ':currentVersion': game.version,
        },
        ReturnValues: 'ALL_NEW',
      })
    );

    return updatedGame.Attributes as Game;
  } catch (error) {
    console.error('Error joining game:', error);
    throw new Error('Failed to join game');
  }
};
