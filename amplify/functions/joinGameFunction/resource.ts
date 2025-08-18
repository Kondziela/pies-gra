import { defineFunction } from '@aws-amplify/backend';

export const joinGameFunction = defineFunction({
  name: 'joinGameFunction',
  entry: './handler.ts',
  environment: {
    GAME_TABLE_NAME: 'Game',
  },
  runtime: 20,
  timeoutSeconds: 30,
});
