import { CardData } from './Card';

export type GameStatus = 'waiting' | 'playing' | 'finished';
export type PlayerColor = 'trefl' | 'pik' | 'kier' | 'karo' | null;

export interface Player {
  id: string;
  name: string;
  cards: CardData[];
  assignedColor: PlayerColor;
  isHost: boolean;
  position: number; // 0-3, clockwise
}

export interface GameMove {
  playerId: string;
  cardPlayed?: CardData;
  actionType: 'playCard' | 'takeBuda' | 'discardCard';
  timestamp: number;
}

export interface GameState {
  id: string;
  status: GameStatus;
  players: Player[];
  currentPlayerIndex: number;
  table: CardData[];
  moves: GameMove[];
  colorsAssigned: boolean;
  round: number;
  turn: number;
  lastWinner?: string;
  discardedCards: CardData[];
}

export class GameEngine {
  private state: GameState;

  constructor(gameId: string, players: Omit<Player, 'cards' | 'assignedColor'>[]) {
    this.state = {
      id: gameId,
      status: 'waiting',
      players: players.map(p => ({
        ...p,
        cards: [],
        assignedColor: null
      })),
      currentPlayerIndex: 0,
      table: [],
      moves: [],
      colorsAssigned: false,
      round: 1,
      turn: 1,
      discardedCards: []
    };
  }

  // Rozdawanie kart na początku gry
  public startGame(): void {
    if (this.state.players.length !== 4) {
      throw new Error('Gra wymaga dokładnie 4 graczy');
    }

    const deck = this.createDeck();
    const shuffledDeck = this.shuffleDeck(deck);

    // Rozdaj 6 kart każdemu graczowi
    this.state.players.forEach((player, index) => {
      player.cards = shuffledDeck.slice(index * 6, (index + 1) * 6);
    });

    // Znajdź gracza z 9 karo
    const startingPlayerIndex = this.findPlayerWith9Karo();
    this.state.currentPlayerIndex = startingPlayerIndex;
    this.state.status = 'playing';
  }

  // Tworzenie talii (24 karty)
  private createDeck(): CardData[] {
    const suits: CardData['suit'][] = ['trefl', 'pik', 'kier', 'karo'];
    const ranks: CardData['rank'][] = ['9', '10', 'J', 'Q', 'K', 'A'];
    const deck: CardData[] = [];

    suits.forEach(suit => {
      ranks.forEach(rank => {
        deck.push({
          suit,
          rank,
          id: `${suit}-${rank}`
        });
      });
    });

    return deck;
  }

  private shuffleDeck(deck: CardData[]): CardData[] {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private findPlayerWith9Karo(): number {
    return this.state.players.findIndex(player => 
      player.cards.some(card => card.suit === 'karo' && card.rank === '9')
    );
  }

  // Walidacja ruchu
  public canPlayCard(playerId: string, card: CardData): boolean {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player || this.getCurrentPlayer().id !== playerId) {
      return false;
    }

    // Sprawdź czy gracz ma tę kartę
    if (!player.cards.find(c => c.id === card.id)) {
      return false;
    }

    // Pierwszy ruch w grze - musi być 9 karo
    if (this.state.moves.length === 0) {
      return card.suit === 'karo' && card.rank === '9';
    }

    // Pierwszy ruch w turze - każda karta
    if (this.state.table.length === 0) {
      return true;
    }

    const topCard = this.state.table[this.state.table.length - 1];

    // Dama trefl może przebić każdą kartę (oprócz wyższych trefli)
    if (card.suit === 'trefl' && card.rank === 'Q') {
      if (topCard.suit === 'trefl' && this.isHigherCard(topCard, card)) {
        return false; // Król trefl lub As trefl blokuje Damę trefl
      }
      return true;
    }

    // Przebijanie tym samym kolorem
    if (card.suit === topCard.suit) {
      return this.isHigherCard(card, topCard);
    }

    // Przebijanie swoim kolorem (po przypisaniu kolorów)
    if (this.state.colorsAssigned && player.assignedColor === card.suit) {
      return this.isHigherCard(card, topCard);
    }

    return false;
  }

  private isHigherCard(card1: CardData, card2: CardData): boolean {
    const rankValues: Record<CardData['rank'], number> = {
      '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
    };
    return rankValues[card1.rank] > rankValues[card2.rank];
  }

  // Zagranie karty
  public playCard(playerId: string, card: CardData): boolean {
    if (!this.canPlayCard(playerId, card)) {
      return false;
    }

    const player = this.state.players.find(p => p.id === playerId)!;

    // Usuń kartę z ręki gracza
    player.cards = player.cards.filter(c => c.id !== card.id);

    // Dodaj kartę na stół
    this.state.table.push(card);

    // Zapisz ruch
    this.state.moves.push({
      playerId,
      cardPlayed: card,
      actionType: 'playCard',
      timestamp: Date.now()
    });

    // Sprawdź czy to Dama trefl - przypisz kolory
    if (card.suit === 'trefl' && card.rank === 'Q' && !this.state.colorsAssigned) {
      this.assignColors(playerId);
    }

    // Po przebiciu gracz musi dołożyć drugą kartę
    if (this.state.table.length > 1 && this.wasBeat(card)) {
      // Gracz zostaje aktywny dla drugiej karty
      return true;
    }

    // Przejdź do następnego gracza
    this.nextPlayer();
    return true;
  }

  private wasBeat(card: CardData): boolean {
    if (this.state.table.length < 2) return false;
    const previousCard = this.state.table[this.state.table.length - 2];
    return this.isHigherCard(card, previousCard) || 
           (card.suit === 'trefl' && card.rank === 'Q');
  }

  private assignColors(startingPlayerId: string): void {
    const colors: PlayerColor[] = ['trefl', 'pik', 'kier', 'karo'];
    const startingPlayerIndex = this.state.players.findIndex(p => p.id === startingPlayerId);

    this.state.players.forEach((player, index) => {
      const colorIndex = (index - startingPlayerIndex + 4) % 4;
      player.assignedColor = colors[colorIndex];
    });

    this.state.colorsAssigned = true;
  }

  // Branie Budy
  public canTakeBuda(playerId: string): boolean {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player || this.getCurrentPlayer().id !== playerId) {
      return false;
    }

    if (this.state.table.length === 0) {
      return false;
    }

    // Sprawdź czy gracz może przebić jakąkolwiek kartę
    const topCard = this.state.table[this.state.table.length - 1];
    return !player.cards.some(card => this.canPlayCard(playerId, card));
  }

  public takeBuda(playerId: string): boolean {
    if (!this.canTakeBuda(playerId)) {
      return false;
    }

    const player = this.state.players.find(p => p.id === playerId)!;

    // Przenieś wszystkie karty ze stołu do ręki gracza
    player.cards.push(...this.state.table);
    this.state.table = [];

    // Zapisz ruch
    this.state.moves.push({
      playerId,
      actionType: 'takeBuda',
      timestamp: Date.now()
    });

    // Przejdź do następnego gracza
    this.nextPlayer();

    // Sprawdź koniec tury
    this.checkTurnEnd();
    return true;
  }

  private nextPlayer(): void {
    this.state.currentPlayerIndex = (this.state.currentPlayerIndex + 1) % 4;
  }

  public getCurrentPlayer(): Player {
    return this.state.players[this.state.currentPlayerIndex];
  }

  private checkTurnEnd(): void {
    const playersWithCards = this.state.players.filter(p => p.cards.length > 0);

    if (playersWithCards.length === 1) {
      // Koniec tury - jeden gracz zostaje z kartami
      const loser = playersWithCards[0];
      this.discardLowestCard(loser);

      // Nowa tura
      this.state.round++;
      this.state.turn = 1;
      this.state.currentPlayerIndex = (this.state.players.findIndex(p => p.id === loser.id) + 1) % 4;
    }
  }

  private discardLowestCard(player: Player): void {
    if (!player.assignedColor || !player.cards.length) return;

    // Znajdź najniższą kartę swojego koloru
    const ownColorCards = player.cards.filter(c => c.suit === player.assignedColor);

    if (ownColorCards.length === 0) return;

    // Sortuj karty od najniższej
    ownColorCards.sort((a, b) => {
      const rankValues: Record<CardData['rank'], number> = {
        '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
      };
      return rankValues[a.rank] - rankValues[b.rank];
    });

    const cardToDiscard = ownColorCards[0];

    // Usuń kartę z ręki i dodaj do odrzuconych
    player.cards = player.cards.filter(c => c.id !== cardToDiscard.id);
    this.state.discardedCards.push(cardToDiscard);

    // Zapisz ruch
    this.state.moves.push({
      playerId: player.id,
      cardPlayed: cardToDiscard,
      actionType: 'discardCard',
      timestamp: Date.now()
    });

    // Sprawdź koniec gry
    if (cardToDiscard.rank === 'A') {
      this.state.status = 'finished';
    }
  }

  public getGameState(): GameState {
    return { ...this.state };
  }

  public getAvailableCards(playerId: string): CardData[] {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player || this.getCurrentPlayer().id !== playerId) {
      return [];
    }

    return player.cards.filter(card => this.canPlayCard(playerId, card));
  }
}
