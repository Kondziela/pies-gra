"use client";

import { useState } from "react";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";
import "./globals.css";
import { AuthProvider, useAuth } from "./components/auth/AuthProvider";
import LoginScreen from "./components/auth/LoginScreen";
import SignUpScreen from "./components/auth/SignUpScreen";
import UserProfile from "./components/auth/UserProfile";
import GameBoard from "./components/game/GameBoard";

Amplify.configure(outputs);

type Screen = 'home' | 'rules' | 'settings' | 'newGame' | 'joinGame' | 'login' | 'signup' | 'profile' | 'game';

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [gameDifficulty, setGameDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <main className="app-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Ładowanie aplikacji...</p>
        </div>
      </main>
    );
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <HomeScreen onNavigate={setCurrentScreen} />;
      case 'rules':
        return <RulesScreen onBack={() => setCurrentScreen('home')} />;
      case 'settings':
        return <SettingsScreen onBack={() => setCurrentScreen('home')} />;
      case 'newGame':
        return <NewGameScreen onBack={() => setCurrentScreen('home')} onNavigate={setCurrentScreen} />;
      case 'joinGame':
        return <JoinGameScreen onBack={() => setCurrentScreen('home')} />;
      case 'login':
        return (
          <LoginScreen 
            onBack={() => setCurrentScreen('home')}
            onSwitchToSignUp={() => setCurrentScreen('signup')}
            onLoginSuccess={() => setCurrentScreen('home')}
          />
        );
      case 'signup':
        return (
          <SignUpScreen 
            onBack={() => setCurrentScreen('home')}
            onSwitchToLogin={() => setCurrentScreen('login')}
            onSignUpSuccess={() => setCurrentScreen('login')}
          />
        );
      case 'profile':
        return <UserProfile onBack={() => setCurrentScreen('home')} />;
      case 'game':
        return <GameBoard onBack={() => setCurrentScreen('home')} />;
      default:
        return <HomeScreen onNavigate={setCurrentScreen} />;
    }
  };

  return (
    <main className="app-container">
      {renderScreen()}
    </main>
  );
}

interface NavigationProps {
  onNavigate: (screen: Screen) => void;
}

interface BackNavigationProps {
  onBack: () => void;
}

function HomeScreen({ onNavigate }: NavigationProps) {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="home-screen">
      <div className="game-header">
        <h1 className="game-title">PIES</h1>
        <p className="game-subtitle">Gra karciana dla 4 graczy</p>

        {isAuthenticated && user && (
          <div className="user-info">
            <p className="welcome-message">
              Witaj, <span className="username">{user.username}</span>!
            </p>
            <button 
              className="profile-link"
              onClick={() => onNavigate('profile')}
            >
              👤 Profil
            </button>
          </div>
        )}
      </div>

      <div className="main-menu">
        {isAuthenticated ? (
          <>
            <button 
              className="menu-button primary"
              onClick={() => onNavigate('newGame')}
            >
              ➕ Nowa gra
            </button>

            <button 
              className="menu-button secondary"
              onClick={() => onNavigate('joinGame')}
            >
              🎮 Dołącz do gry
            </button>
          </>
        ) : (
          <>
            <button 
              className="menu-button primary"
              onClick={() => onNavigate('login')}
            >
              🔐 Zaloguj się
            </button>

            <button 
              className="menu-button secondary"
              onClick={() => onNavigate('signup')}
            >
              📝 Zarejestruj się
            </button>
          </>
        )}

        <button 
          className="menu-button tertiary"
          onClick={() => onNavigate('rules')}
        >
          📖 Zasady gry
        </button>

        <button 
          className="menu-button tertiary"
          onClick={() => onNavigate('settings')}
        >
          ⚙️ Ustawienia
        </button>
      </div>

      <div className="footer">
        <p className="version">v1.0.0</p>
      </div>
    </div>
  );
}

function RulesScreen({ onBack }: BackNavigationProps) {
  return (
    <div className="rules-screen">
      <div className="screen-header">
        <button className="back-button" onClick={onBack}>
          ← Powrót
        </button>
        <h1 className="screen-title">Zasady gry</h1>
      </div>

      <div className="rules-content">
        <div className="rule-section">
          <h2>Cel gry</h2>
          <p>
            Celem jest jak najszybsze pozbycie się kart z ręki oraz zachowanie w grze 
            możliwie największej liczby kart swojego koloru. Gra kończy się, gdy gracz 
            zmuszony jest na koniec rozdania odrzucić z gry swojego Asa.
          </p>
        </div>

        <div className="rule-section">
          <h2>Przygotowanie</h2>
          <ul>
            <li>Liczba graczy: 4</li>
            <li>Talia: 24 karty (od 9 do Asa w każdym kolorze)</li>
            <li>Rozdanie: wszystkie karty, po 6 na gracza</li>
            <li>Pierwszą turę rozpoczyna 9 Karo</li>
          </ul>
        </div>

        <div className="rule-section">
          <h2>Przebieg gry</h2>
          <ul>
            <li>Gra przebiega zgodnie z ruchem wskazówek zegara</li>
            <li>Gracz musi przebić kartę wyższą tego samego koloru lub Damą Trefl</li>
            <li>Po przebiciu obowiązkowo dokłada drugą kartę</li>
            <li>Jeśli nie może przebić, bierze Budę (wszystkie karty ze stołu)</li>
          </ul>
        </div>

        <div className="rule-section">
          <h2>Dama Trefl</h2>
          <p>
            Gdy ktoś zagra Damę Trefl, przypisuje kolory: Trefl (atut) → Pik → Kier → Karo.
            Od tego momentu gracze mogą przebijać dowolną kartę swoim kolorem.
          </p>
        </div>
      </div>
    </div>
  );
}

function SettingsScreen({ onBack }: BackNavigationProps) {
  return (
    <div className="settings-screen">
      <div className="screen-header">
        <button className="back-button" onClick={onBack}>
          ← Powrót
        </button>
        <h1 className="screen-title">Ustawienia</h1>
      </div>

      <div className="settings-content">
        <div className="setting-group">
          <h3>Język</h3>
          <select className="setting-select">
            <option value="pl">Polski</option>
            <option value="en">English</option>
          </select>
        </div>

        <div className="setting-group">
          <h3>Motyw</h3>
          <div className="setting-radio-group">
            <label>
              <input type="radio" name="theme" value="light" defaultChecked />
              Jasny
            </label>
            <label>
              <input type="radio" name="theme" value="dark" />
              Ciemny
            </label>
          </div>
        </div>

        <div className="setting-group">
          <h3>Dźwięki</h3>
          <label className="setting-checkbox">
            <input type="checkbox" defaultChecked />
            Efekty dźwiękowe
          </label>
        </div>

        <div className="setting-group">
          <h3>Powiadomienia</h3>
          <label className="setting-checkbox">
            <input type="checkbox" defaultChecked />
            Powiadomienia push
          </label>
        </div>
      </div>
    </div>
  );
}

interface NewGameProps extends BackNavigationProps, NavigationProps {
  onSetDifficulty?: (difficulty: 'easy' | 'medium' | 'hard') => void;
}

function NewGameScreen({ onBack, onNavigate, onSetDifficulty }: NewGameProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  const handleStartBotGame = () => {
    // Użyj localStorage jako fallback
    try {
      if (onSetDifficulty && typeof onSetDifficulty === 'function') {
        onSetDifficulty(selectedDifficulty);
      } else {
        // Fallback: zapisz w localStorage
        localStorage.setItem('gameDifficulty', selectedDifficulty);
      }
    } catch (error) {
      console.error('Error setting difficulty:', error);
      localStorage.setItem('gameDifficulty', selectedDifficulty);
    }
    onNavigate('game');
  };

  return (
    <div className="new-game-screen">
      <div className="screen-header">
        <button className="back-button" onClick={onBack}>
          ← Powrót
        </button>
        <h1 className="screen-title">Nowa gra</h1>
      </div>

      <div className="new-game-content">
        <div className="game-option">
          <h3>Utwórz pokój</h3>
          <p>Stwórz prywatny pokój i zaproś znajomych</p>
          <button className="action-button primary">
            Utwórz pokój
          </button>
        </div>

        <div className="divider">lub</div>

        <div className="game-option">
          <h3>Gra z botami</h3>
          <p>Trenuj z komputerowymi przeciwnikami</p>
          <div className="difficulty-selection">
            <label>Poziom trudności:</label>
            <select 
              className="difficulty-select"
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
            >
              <option value="easy">Łatwy - Boty grają losowo</option>
              <option value="medium">Średni - Boty mają podstawową strategię</option>
              <option value="hard">Trudny - Boty używają zaawansowanej strategii</option>
            </select>
          </div>
          <button 
            className="action-button secondary"
            onClick={handleStartBotGame}
          >
            🤖 Start gry z botami
          </button>
        </div>
      </div>
    </div>
  );
}

function JoinGameScreen({ onBack }: BackNavigationProps) {
  const [gameCode, setGameCode] = useState('');

  return (
    <div className="join-game-screen">
      <div className="screen-header">
        <button className="back-button" onClick={onBack}>
          ← Powrót
        </button>
        <h1 className="screen-title">Dołącz do gry</h1>
      </div>

      <div className="join-game-content">
        <div className="join-option">
          <h3>Kod pokoju</h3>
          <p>Wprowadź kod otrzymany od znajomego</p>
          <div className="code-input-group">
            <input
              type="text"
              placeholder="Wprowadź kod..."
              value={gameCode}
              onChange={(e) => setGameCode(e.target.value)}
              className="code-input"
              maxLength={6}
            />
            <button 
              className="action-button primary"
              disabled={gameCode.length < 4}
            >
              Dołącz
            </button>
          </div>
        </div>

        <div className="divider">lub</div>

        <div className="join-option">
          <h3>Szybka gra</h3>
          <p>Automatyczne dopasowanie z innymi graczami</p>
          <button className="action-button secondary">
            🎲 Losuj przeciwników
          </button>
        </div>
      </div>
    </div>
  );
}
