import { defineFunction } from '@aws-amplify/backend';

export const gameEngineFunction = defineFunction({
  name: 'gameEngineFunction',
  entry: './handler.ts',
  environment: {
    GAME_TABLE_NAME: 'Game',
    GAME_HAND_TABLE_NAME: 'GameHand',
  },
  runtime: 20,
  timeoutSeconds: 60, // Game operations might take longer
});
