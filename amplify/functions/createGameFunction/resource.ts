import { defineFunction } from '@aws-amplify/backend';

export const createGameFunction = defineFunction({
  name: 'createGameFunction',
  entry: './handler.ts',
  environment: {
    GAME_TABLE_NAME: 'Game', // Will be replaced with actual table name
  },
  runtime: 20,
  timeoutSeconds: 30,
});
