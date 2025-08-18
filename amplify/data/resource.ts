import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Game: a
    .model({
      id: a.id(),
      code: a.string().required(),
      status: a.enum(['lobby', 'playing', 'finished']),
      hostUserId: a.string().required(),
      seats: a.json().array(),
      turnSeat: a.integer(),
      phase: a.enum(['setup', 'playing', 'round_end']),
      assignedColors: a.boolean(),
      tableCards: a.json().array(),
      budaOwnerSeat: a.integer(),
      currentRound: a.integer(),
      winnerOrder: a.string().array(),
      version: a.integer(),
    })
    .authorization((allow) => [
      allow.authenticated().to(['create', 'read', 'update']),
    ]),

  GameHand: a
    .model({
      id: a.id(),
      gameId: a.id().required(),
      seat: a.integer().required(),
      cards: a.json().array(),
      game: a.belongsTo('Game', 'gameId'),
    })
    .authorization((allow) => [
      allow.authenticated().to(['create', 'read', 'update']),
    ]),

  ChatMessage: a
    .model({
      id: a.id(),
      gameId: a.id().required(),
      userId: a.string().required(),
      message: a.string().required(),
      type: a.enum(['text', 'emoji', 'system']),
    })
    .authorization((allow) => [
      allow.authenticated().to(['create', 'read']),
    ]),

  GameEvent: a
    .model({
      id: a.id(),
      gameId: a.id().required(),
      type: a.string().required(),
      payload: a.json(),
      userId: a.string(),
    })
    .authorization((allow) => [
      allow.authenticated().to(['create', 'read']),
    ]),
});

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});

export type Schema = ClientSchema<typeof schema>;
