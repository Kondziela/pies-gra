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
  waitingForSecondCard: boolean; // Czy gracz musi dołożyć drugą kartę po przebiciu
  secondCardPlayerId?: string; // ID gracza który musi dołożyć drugą kartę
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
      discardedCards: [],
      waitingForSecondCard: false,
      secondCardPlayerId: undefined
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

    // DRUGA KARTA PO PRZEBICIU - może być DOWOLNA!
    if (this.state.waitingForSecondCard && this.state.secondCardPlayerId === playerId) {
      console.log(`✅ ${this.getPlayerName(playerId)} może zagrać dowolną kartę jako drugą po przebiciu`);
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
      console.log(`❌ ${this.getPlayerName(playerId)} nie może zagrać ${this.formatCard(card)}`);
      return false;
    }

    const player = this.state.players.find(p => p.id === playerId)!;
    const topCard = this.state.table.length > 0 ? this.state.table[this.state.table.length - 1] : null;

    // Sprawdź czy to druga karta po przebiciu
    const isSecondCard = this.state.waitingForSecondCard && this.state.secondCardPlayerId === playerId;

    // Log szczegółów ruchu
    if (isSecondCard) {
      console.log(`🎯 ${this.getPlayerName(playerId)} dokłada drugą kartę: ${this.formatCard(card)} (dowolna po przebiciu)`);
    } else if (topCard) {
      console.log(`🎯 ${this.getPlayerName(playerId)} zagrywa ${this.formatCard(card)} na ${this.formatCard(topCard)}`);
    } else {
      console.log(`🎯 ${this.getPlayerName(playerId)} rozpoczyna turę kartą ${this.formatCard(card)}`);
    }

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
      console.log(`👑 ${this.getPlayerName(playerId)} zagrał Damę Trefl - przypisywanie kolorów!`);
      this.assignColors(playerId);
    }

    // Jeśli to była druga karta po przebiciu
    if (isSecondCard) {
      console.log(`✅ ${this.getPlayerName(playerId)} zakończył dołożenie drugiej karty`);
      this.state.waitingForSecondCard = false;
      this.state.secondCardPlayerId = undefined;
      this.nextPlayer();
      return true;
    }

    // Po przebiciu gracz musi dołożyć drugą kartę
    if (this.state.table.length > 1 && this.wasBeat(card)) {
      console.log(`💪 ${this.getPlayerName(playerId)} przebił kartę - musi dołożyć drugą (DOWOLNĄ)!`);
      this.state.waitingForSecondCard = true;
      this.state.secondCardPlayerId = playerId;
      return true; // Gracz zostaje aktywny
    }

    console.log(`👥 Karty pozostałe: ${player.cards.length} (${this.getPlayerName(playerId)})`);

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

    console.log(`🎨 PRZYPISYWANIE KOLORÓW (rozpoczął ${this.getPlayerName(startingPlayerId)}):`);

    this.state.players.forEach((player, index) => {
      const colorIndex = (index - startingPlayerIndex + 4) % 4;
      player.assignedColor = colors[colorIndex];
      console.log(`   ${this.getColorSymbol(player.assignedColor)} ${this.getPlayerName(player.id)} → ${player.assignedColor?.toUpperCase()}`);
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

    // Jeśli gracz czeka na drugą kartę, nie może wziąć Budy
    if (this.state.waitingForSecondCard && this.state.secondCardPlayerId === playerId) {
      console.log(`⚠️ ${this.getPlayerName(playerId)} musi dołożyć drugą kartę - nie może wziąć Budy`);
      return false;
    }

    // Sprawdź czy gracz może przebić jakąkolwiek kartę
    return !player.cards.some(card => this.canPlayCard(playerId, card));
  }

  public takeBuda(playerId: string): boolean {
    if (!this.canTakeBuda(playerId)) {
      console.log(`❌ ${this.getPlayerName(playerId)} nie może wziąć Budy`);
      return false;
    }

    const player = this.state.players.find(p => p.id === playerId)!;
    const budaCards = [...this.state.table];

    console.log(`🗂️ ${this.getPlayerName(playerId)} bierze BUDĘ (${budaCards.length} kart):`);
    budaCards.forEach(card => console.log(`   📄 ${this.formatCard(card)}`));

    // Przenieś wszystkie karty ze stołu do ręki gracza
    player.cards.push(...this.state.table);
    this.state.table = [];

    console.log(`📋 ${this.getPlayerName(playerId)} ma teraz ${player.cards.length} kart`);

    // Zapisz ruch
    this.state.moves.push({
      playerId,
      actionType: 'takeBuda',
      timestamp: Date.now()
    });

    // Reset stanu drugiej karty
    this.state.waitingForSecondCard = false;
    this.state.secondCardPlayerId = undefined;

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
      console.log(`🏁 KONIEC TURY! ${this.getPlayerName(loser.id)} został z kartami`);
      this.discardLowestCard(loser);

      // Nowa tura
      this.state.round++;
      this.state.turn = 1;
      this.state.currentPlayerIndex = (this.state.players.findIndex(p => p.id === loser.id) + 1) % 4;
      console.log(`🔄 NOWA TURA ${this.state.round} - rozpoczyna ${this.getPlayerName(this.getCurrentPlayer().id)}`);
    }
  }

  private discardLowestCard(player: Player): void {
    if (!player.assignedColor || !player.cards.length) {
      console.log(`⚠️ ${this.getPlayerName(player.id)} nie ma karty do odrzucenia`);
      return;
    }

    // Znajdź najniższą kartę swojego koloru
    const ownColorCards = player.cards.filter(c => c.suit === player.assignedColor);

    if (ownColorCards.length === 0) {
      console.log(`⚠️ ${this.getPlayerName(player.id)} nie ma kart swojego koloru do odrzucenia`);
      return;
    }

    // Sortuj karty od najniższej
    ownColorCards.sort((a, b) => {
      const rankValues: Record<CardData['rank'], number> = {
        '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
      };
      return rankValues[a.rank] - rankValues[b.rank];
    });

    const cardToDiscard = ownColorCards[0];

    console.log(`🗑️ ${this.getPlayerName(player.id)} odrzuca ${this.formatCard(cardToDiscard)} (najniższa karta swojego koloru)`);

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
      console.log(`🎊 KONIEC GRY! ${this.getPlayerName(player.id)} musiał odrzucić Asa!`);
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

  // Helper functions for console logging
  private getPlayerName(playerId: string): string {
    const player = this.state.players.find(p => p.id === playerId);
    return player?.name || playerId;
  }

  private formatCard(card: CardData): string {
    const suitSymbols = {
      'trefl': '♣',
      'pik': '♠', 
      'kier': '♥',
      'karo': '♦'
    };

    const rankNames = {
      'J': 'W',
      'Q': 'D', 
      'K': 'K',
      'A': 'A'
    };

    const rank = rankNames[card.rank as keyof typeof rankNames] || card.rank;
    const suit = suitSymbols[card.suit];

    return `${rank}${suit}`;
  }

  private getColorSymbol(color: PlayerColor): string {
    if (!color) return '⚪';
    const symbols = {
      'trefl': '♣',
      'pik': '♠',
      'kier': '♥', 
      'karo': '♦'
    };
    return symbols[color] || '⚪';
  }
}
