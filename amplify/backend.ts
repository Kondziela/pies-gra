import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';

/**
 * Backend definition for Pies Card Game
 * @see https://docs.amplify.aws/gen2/build-a-backend/ to add API, Function, and more
 */
export const backend = defineBackend({
  auth,
});
