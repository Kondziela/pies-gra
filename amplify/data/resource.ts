import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

/*== STEP 1 ===============================================================
The section below creates a Todo database table with a "content" field.
=========================================================================*/
const schema = a.schema({
  // Game model - główna encja gry
  Game: a
    .model({
      id: a.id(),
      code: a.string().required(),
      status: a.enum(['lobby', 'playing', 'finished']),
      hostUserId: a.string().required(),
      seats: a.json().array(), // Array<PlayerSeat>
      turnSeat: a.integer(),
      phase: a.enum(['setup', 'playing', 'round_end']),
      assignedColors: a.boolean().default(false),
      tableCards: a.json().array(), // Array<Card>
      budaOwnerSeat: a.integer(),
      currentRound: a.integer().default(1),
      winnerOrder: a.string().array(),
      version: a.integer().default(1),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [
      // Host może wszystko
      allow.owner().to(['create', 'update', 'delete']).identityClaim('sub'),
      // Członkowie gry mogą czytać i aktualizować (przez resolvery)
      allow.authenticated().to(['read']),
      // Publiczne gry mogą być listowane (bez wrażliwych danych)
      allow.guest().to(['read']).where(field => field.status.eq('lobby')),
    ]),

  // GameHand - karty na ręce gracza (opcjonalne, osobna tabela dla performance)
  GameHand: a
    .model({
      id: a.id(),
      gameId: a.id().required(),
      seat: a.integer().required(),
      cards: a.json().array(), // Array<Card>
      game: a.belongsTo('Game', 'gameId'),
    })
    .authorization((allow) => [
      // Tylko właściciel ręki może ją widzieć
      allow.authenticated().to(['read']).where(field => field.gameId.eq('PLACEHOLDER')),
    ]),

  // ChatMessage - wiadomości czatu w grze
  ChatMessage: a
    .model({
      id: a.id(),
      gameId: a.id().required(),
      userId: a.string().required(),
      message: a.string().required(),
      type: a.enum(['text', 'emoji', 'system']).default('text'),
      createdAt: a.datetime(),
      game: a.belongsTo('Game', 'gameId'),
    })
    .authorization((allow) => [
      // Twórca może wszystko
      allow.owner().to(['create', 'update', 'delete']).identityClaim('sub'),
      // Członkowie gry mogą czytać
      allow.authenticated().to(['read']),
    ]),

  // GameEvent - audyt/log zdarzeń w grze (opcjonalne)
  GameEvent: a
    .model({
      id: a.id(),
      gameId: a.id().required(),
      type: a.string().required(),
      payload: a.json(),
      userId: a.string(),
      createdAt: a.datetime(),
      game: a.belongsTo('Game', 'gameId'),
    })
    .authorization((allow) => [
      allow.authenticated().to(['create', 'read']),
    ]),
})
.authorization((allow) => [allow.resource(createGame)]);

// Custom mutations z Lambda resolvers
const createGame = a
  .mutation()
  .arguments({ 
    name: a.string(),
    isPublic: a.boolean().default(false),
  })
  .returns(a.ref('Game'))
  .authorization((allow) => [allow.authenticated()])
  .handler(a.handler.function('createGameFunction'));

const joinGame = a
  .mutation()
  .arguments({ 
    code: a.string().required(),
  })
  .returns(a.ref('Game'))
  .authorization((allow) => [allow.authenticated()])
  .handler(a.handler.function('joinGameFunction'));

const startGame = a
  .mutation()
  .arguments({ 
    gameId: a.id().required(),
  })
  .returns(a.ref('Game'))
  .authorization((allow) => [allow.authenticated()])
  .handler(a.handler.function('gameEngineFunction'));

const playCard = a
  .mutation()
  .arguments({ 
    gameId: a.id().required(),
    card: a.json().required(), // Card object
    secondCard: a.json(), // Optional second card
  })
  .returns(a.ref('Game'))
  .authorization((allow) => [allow.authenticated()])
  .handler(a.handler.function('gameEngineFunction'));

const takeBuda = a
  .mutation()
  .arguments({ 
    gameId: a.id().required(),
  })
  .returns(a.ref('Game'))
  .authorization((allow) => [allow.authenticated()])
  .handler(a.handler.function('gameEngineFunction'));

const heartbeat = a
  .mutation()
  .arguments({ 
    gameId: a.id().required(),
  })
  .returns(a.json()) // PresenceAck
  .authorization((allow) => [allow.authenticated()])
  .handler(a.handler.function('presenceFunction'));

// Custom queries
const getGame = a
  .query()
  .arguments({ 
    id: a.id(),
    code: a.string(),
  })
  .returns(a.ref('Game'))
  .authorization((allow) => [allow.authenticated()])
  .handler(a.handler.function('getGameFunction'));

const listPublicGames = a
  .query()
  .arguments({
    limit: a.integer().default(20),
    nextToken: a.string(),
  })
  .returns(a.json()) // Custom return type for pagination
  .authorization((allow) => [allow.authenticated()])
  .handler(a.handler.function('listGamesFunction'));

// Subscriptions
const onGameUpdated = a
  .subscription()
  .for(a.ref('Game'))
  .arguments({ gameId: a.id().required() })
  .authorization((allow) => [allow.authenticated()]);

const onPlayerJoined = a
  .subscription()
  .for(a.ref('Game'))
  .arguments({ gameId: a.id().required() })
  .authorization((allow) => [allow.authenticated()]);

const onChatMessage = a
  .subscription()
  .for(a.ref('ChatMessage'))
  .arguments({ gameId: a.id().required() })
  .authorization((allow) => [allow.authenticated()]);

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: {
      expiresInDays: 7,
    },
  },
});

export type Schema = ClientSchema<typeof schema>;
