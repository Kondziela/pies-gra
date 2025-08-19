import { CardData } from './Card';
import { GameEngine, Player, GameState } from './GameEngine';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

interface AIStrategy {
  selectCardToPlay(availableCards: CardData[], gameState: GameState, playerId: string): CardData | null;
  shouldTakeBuda(availableCards: CardData[], gameState: GameState, playerId: string): boolean;
}

export class AIPlayer {
  private strategy: AIStrategy;
  private difficulty: DifficultyLevel;

  constructor(difficulty: DifficultyLevel = 'medium') {
    this.difficulty = difficulty;
    this.strategy = this.getStrategy(difficulty);
  }

  private getStrategy(difficulty: DifficultyLevel): AIStrategy {
    switch (difficulty) {
      case 'easy':
        return new EasyAI();
      case 'medium':
        return new MediumAI();
      case 'hard':
        return new HardAI();
      default:
        return new MediumAI();
    }
  }

  public async makeMove(gameEngine: GameEngine, playerId: string): Promise<boolean> {
    const gameState = gameEngine.getGameState();
    const currentPlayer = gameState.players.find(p => p.id === playerId);

    if (!currentPlayer || gameEngine.getCurrentPlayer().id !== playerId) {
      return false;
    }

    const playerName = currentPlayer.name;
    console.log(`🤖 ${playerName} (${this.difficulty.toUpperCase()}) myśli...`);

    // Simulacja myślenia - opóźnienie dla realizmu
    await this.delay(this.getThinkingTime());

    const availableCards = gameEngine.getAvailableCards(playerId);

    console.log(`🤖 ${playerName} ma ${availableCards.length} dostępnych kart z ${currentPlayer.cards.length} w ręce`);

    // Sprawdź czy można zagrać kartę
    if (availableCards.length > 0) {
      const selectedCard = this.strategy.selectCardToPlay(availableCards, gameState, playerId);
      if (selectedCard) {
        console.log(`🤖 ${playerName} wybiera kartę do zagrania: ${this.formatCard(selectedCard)}`);
        return gameEngine.playCard(playerId, selectedCard);
      }
    }

    // Jeśli nie można zagrać żadnej karty, weź Budę
    if (gameEngine.canTakeBuda(playerId)) {
      console.log(`🤖 ${playerName} musi wziąć Budę (brak możliwych kart)`);
      return gameEngine.takeBuda(playerId);
    }

    console.log(`🤖 ${playerName} nie może wykonać ruchu!`);
    return false;
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

  private getThinkingTime(): number {
    const baseTimes = { easy: 800, medium: 1200, hard: 1800 };
    const baseTime = baseTimes[this.difficulty];
    // Dodaj losowe opóźnienie dla naturalności
    return baseTime + Math.random() * 1000;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Łatwy AI - gra losowo, nie ma strategii
class EasyAI implements AIStrategy {
  selectCardToPlay(availableCards: CardData[], gameState: GameState, playerId: string): CardData | null {
    if (availableCards.length === 0) return null;

    // Losowy wybór spośród dostępnych kart
    const randomIndex = Math.floor(Math.random() * availableCards.length);
    return availableCards[randomIndex];
  }

  shouldTakeBuda(availableCards: CardData[], gameState: GameState, playerId: string): boolean {
    // Łatwy AI nie ma preferencji
    return availableCards.length === 0;
  }
}

// Średni AI - ma podstawową strategię
class MediumAI implements AIStrategy {
  selectCardToPlay(availableCards: CardData[], gameState: GameState, playerId: string): CardData | null {
    if (availableCards.length === 0) return null;

    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return availableCards[0];

    // Strategia 1: Jeśli nie ma przypisanych kolorów, spróbuj zagrać Damę Trefl
    if (!gameState.colorsAssigned) {
      const queenOfClubs = availableCards.find(c => c.suit === 'trefl' && c.rank === 'Q');
      if (queenOfClubs) return queenOfClubs;
    }

    // Strategia 2: Jeśli mamy przypisany kolor, preferuj karty swojego koloru
    if (gameState.colorsAssigned && player.assignedColor) {
      const ownColorCards = availableCards.filter(c => c.suit === player.assignedColor);
      if (ownColorCards.length > 0) {
        // Zagraj najwyższą kartę swojego koloru
        return this.getHighestCard(ownColorCards);
      }
    }

    // Strategia 3: Zagraj najwyższą dostępną kartę
    return this.getHighestCard(availableCards);
  }

  shouldTakeBuda(availableCards: CardData[], gameState: GameState, playerId: string): boolean {
    return availableCards.length === 0;
  }

  private getHighestCard(cards: CardData[]): CardData {
    const rankValues: Record<CardData['rank'], number> = {
      '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
    };

    return cards.reduce((highest, current) => {
      return rankValues[current.rank] > rankValues[highest.rank] ? current : highest;
    });
  }
}

// Trudny AI - zaawansowana strategia
class HardAI implements AIStrategy {
  selectCardToPlay(availableCards: CardData[], gameState: GameState, playerId: string): CardData | null {
    if (availableCards.length === 0) return null;

    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return availableCards[0];

    // Zaawansowana analiza stanu gry
    const gameAnalysis = this.analyzeGameState(gameState, playerId);

    // Strategia 1: Kontroluj przypisanie kolorów
    if (!gameState.colorsAssigned && this.shouldPlayQueenOfClubs(availableCards, gameAnalysis)) {
      const queenOfClubs = availableCards.find(c => c.suit === 'trefl' && c.rank === 'Q');
      if (queenOfClubs) return queenOfClubs;
    }

    // Strategia 2: Minimalizuj ryzyko wzięcia Budy przez przeciwników
    if (gameState.colorsAssigned && player.assignedColor) {
      const strategicCard = this.selectStrategicCard(availableCards, gameAnalysis, player);
      if (strategicCard) return strategicCard;
    }

    // Strategia 3: Optymalizuj karty swojego koloru
    if (gameState.colorsAssigned && player.assignedColor) {
      const ownColorCards = availableCards.filter(c => c.suit === player.assignedColor);
      if (ownColorCards.length > 0) {
        return this.selectOptimalOwnColorCard(ownColorCards, gameAnalysis);
      }
    }

    // Fallback: zagraj najbezpieczniejszą kartę
    return this.selectSafestCard(availableCards, gameAnalysis);
  }

  shouldTakeBuda(availableCards: CardData[], gameState: GameState, playerId: string): boolean {
    return availableCards.length === 0;
  }

  private analyzeGameState(gameState: GameState, playerId: string) {
    const otherPlayers = gameState.players.filter(p => p.id !== playerId);
    const totalCardsInPlay = gameState.players.reduce((sum, p) => sum + p.cards.length, 0);
    const gameProgression = 1 - (totalCardsInPlay / 24); // 0 = początek, 1 = koniec

    return {
      otherPlayers,
      gameProgression,
      isLateGame: gameProgression > 0.6,
      tableSize: gameState.table.length,
      topCard: gameState.table[gameState.table.length - 1],
      discardedCards: gameState.discardedCards
    };
  }

  private shouldPlayQueenOfClubs(availableCards: CardData[], analysis: any): boolean {
    // Zagraj Damę Trefl tylko jeśli jest to korzystne
    const hasQueenOfClubs = availableCards.some(c => c.suit === 'trefl' && c.rank === 'Q');

    if (!hasQueenOfClubs) return false;

    // Preferuj granie Damą Trefl na początku gry
    return !analysis.isLateGame || Math.random() > 0.7;
  }

  private selectStrategicCard(availableCards: CardData[], analysis: any, player: Player): CardData | null {
    const ownColorCards = availableCards.filter(c => c.suit === player.assignedColor);

    if (ownColorCards.length > 0 && analysis.isLateGame) {
      // W późnej grze, oszczędzaj wysokie karty swojego koloru
      return this.getLowestCard(ownColorCards);
    }

    if (analysis.tableSize > 2) {
      // Przy dużej liczbie kart na stole, zagraj defensywnie
      return this.getLowestCard(availableCards);
    }

    return null;
  }

  private selectOptimalOwnColorCard(ownColorCards: CardData[], analysis: any): CardData {
    if (analysis.isLateGame) {
      // W końcówce oszczędzaj Asa
      const nonAces = ownColorCards.filter(c => c.rank !== 'A');
      if (nonAces.length > 0) {
        return this.getLowestCard(nonAces);
      }
    }

    return this.getHighestCard(ownColorCards);
  }

  private selectSafestCard(availableCards: CardData[], analysis: any): CardData {
    // Preferuj niskie karty jako bezpieczne
    return this.getLowestCard(availableCards);
  }

  private getHighestCard(cards: CardData[]): CardData {
    const rankValues: Record<CardData['rank'], number> = {
      '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
    };

    return cards.reduce((highest, current) => {
      return rankValues[current.rank] > rankValues[highest.rank] ? current : highest;
    });
  }

  private getLowestCard(cards: CardData[]): CardData {
    const rankValues: Record<CardData['rank'], number> = {
      '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
    };

    return cards.reduce((lowest, current) => {
      return rankValues[current.rank] < rankValues[lowest.rank] ? current : lowest;
    });
  }
}

// Manager dla wszystkich AI graczy
export class AIManager {
  private aiPlayers: Map<string, AIPlayer> = new Map();

  public addAIPlayer(playerId: string, difficulty: DifficultyLevel = 'medium'): void {
    this.aiPlayers.set(playerId, new AIPlayer(difficulty));
  }

  public removeAIPlayer(playerId: string): void {
    this.aiPlayers.delete(playerId);
  }

  public async makeAIMove(gameEngine: GameEngine, playerId: string): Promise<boolean> {
    const aiPlayer = this.aiPlayers.get(playerId);
    if (!aiPlayer) return false;

    return await aiPlayer.makeMove(gameEngine, playerId);
  }

  public isAIPlayer(playerId: string): boolean {
    return this.aiPlayers.has(playerId);
  }

  public getAllAIPlayerIds(): string[] {
    return Array.from(this.aiPlayers.keys());
  }
}
