import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';

/**
 * Backend definition for Pies Card Game
 */
export const backend = defineBackend({
  auth,
  data,
});
