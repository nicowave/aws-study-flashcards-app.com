import React, { useState, useEffect, useCallback } from 'react';
import { getDomainById } from './data';
import { useSound, useGameStats } from './hooks';
import { AuthProvider, useAuth } from './context/AuthContext';
import {
  AchievementNotification,
  MenuScreen,
  DomainSelect,
  QuestionScreen,
  ResultsScreen,
  StatsScreen
} from './components';
import StudyGuide from './components/StudyGuide';
import AuthScreen from './components/AuthScreen';
import UserBadge from './components/UserBadge';
import { GameIcon, BookIcon } from './components/Icons';
import './styles/global.css';
import './components/AuthScreen.css';

const HUB_URL = 'https://aws-study-flashcards.app';
const CERT_ID = 'ai-practitioner';

const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const QUESTIONS_PER_SESSION = 5;

// Loading Screen
const LoadingScreen = () => (
  <div className="loading-screen">
    <div className="loading-spinner"></div>
    <p>Loading...</p>
  </div>
);

// Tab Navigation Component
const TabNavigation = ({ activeTab, onTabChange }) => {
  return (
    <div className="tab-navigation">
      <button 
        className={`tab-btn ${activeTab === 'game' ? 'active' : ''}`}
        onClick={() => onTabChange('game')}
      >
        <span className="tab-icon"><GameIcon size={18} /></span>
        <span className="tab-label">Quiz Game</span>
      </button>
      <button 
        className={`tab-btn ${activeTab === 'study' ? 'active' : ''}`}
        onClick={() => onTabChange('study')}
      >
        <span className="tab-icon"><BookIcon size={18} /></span>
        <span className="tab-label">Study Guide</span>
      </button>
    </div>
  );
};

// Main Game Content (only rendered when authenticated)
function GameContent() {
  const { user, syncLocalProgress, logout } = useAuth();
  
  // Main app tab state
  const [activeTab, setActiveTab] = useState('game');
  
  // Game state
  const [gameState, setGameState] = useState('menu');
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [currentQuestions, setCurrentQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [sessionStats, setSessionStats] = useState({ 
    correct: 0, total: 0, streak: 0, startTime: null 
  });
  const [showParticles, setShowParticles] = useState(false);
  const [newAchievement, setNewAchievement] = useState(null);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const { playSound } = useSound(soundEnabled);
  const {
    globalStats,
    recordCorrectAnswer,
    recordIncorrectAnswer,
    completeSession,
    unlockAchievement,
    getNewAchievements,
    resetStats
  } = useGameStats();

  // Sync progress on mount and when stats change significantly
  useEffect(() => {
    if (user && globalStats) {
      syncLocalProgress(globalStats, CERT_ID);
    }
  }, [user, globalStats.sessionsCompleted]);

  useEffect(() => {
    const newAchievements = getNewAchievements();
    if (newAchievements.length > 0) {
      const achievement = newAchievements[0];
      unlockAchievement(achievement.id, achievement.xpReward);
      setNewAchievement(achievement);
      playSound('levelup');
      setTimeout(() => setNewAchievement(null), 3000);
    }
  }, [globalStats.totalAnswered, globalStats.maxStreak, globalStats.domainsCompleted]);

  const startDomain = useCallback((domainId) => {
    const domain = getDomainById(domainId);
    const questions = shuffleArray(domain.questions).slice(0, QUESTIONS_PER_SESSION);
    setSelectedDomain(domain);
    setCurrentQuestions(questions);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setSessionStats({ correct: 0, total: 0, streak: 0, startTime: Date.now() });
    setQuestionStartTime(Date.now());
    setGameState('playing');
  }, []);

  const handleAnswer = useCallback((answerIndex) => {
    if (selectedAnswer !== null) return;
    // AI Practitioner uses 'correct' property
    const isCorrect = answerIndex === currentQuestions[currentQuestionIndex].correct;
    const responseTime = (Date.now() - questionStartTime) / 1000;
    setSelectedAnswer(answerIndex);
    setShowExplanation(true);

    if (isCorrect) {
      playSound('correct');
      setShowParticles(true);
      setTimeout(() => setShowParticles(false), 600);
      recordCorrectAnswer(responseTime);
      setSessionStats(prev => ({
        ...prev, correct: prev.correct + 1, total: prev.total + 1, streak: prev.streak + 1
      }));
    } else {
      playSound('incorrect');
      recordIncorrectAnswer();
      setSessionStats(prev => ({ ...prev, total: prev.total + 1, streak: 0 }));
    }
  }, [selectedAnswer, currentQuestions, currentQuestionIndex, questionStartTime, playSound, recordCorrectAnswer, recordIncorrectAnswer]);

  const nextQuestion = useCallback(() => {
    if (currentQuestionIndex < currentQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setQuestionStartTime(Date.now());
    } else {
      completeSession(selectedDomain.id, sessionStats.correct, currentQuestions.length);
      // Sync after completing session
      if (user) {
        syncLocalProgress(globalStats, CERT_ID);
      }
      setGameState('results');
    }
  }, [currentQuestionIndex, currentQuestions.length, completeSession, selectedDomain, sessionStats.correct, user, syncLocalProgress, globalStats]);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    if (tab === 'game') {
      setGameState('menu');
    }
  }, []);

  const handleLogout = async () => {
    await logout();
    // Redirect to hub after logout
    window.location.href = HUB_URL;
  };

  return (
    <div className="game-container">
      <AchievementNotification achievement={newAchievement} />
      
      {/* User Header */}
      {(gameState === 'menu' || activeTab === 'study') && (
        <div className="user-header">
          <a href={HUB_URL} className="back-to-hub-link">← Study Hub</a>
          <UserBadge onLogout={handleLogout} />
        </div>
      )}
      
      {/* Tab Navigation */}
      {(gameState === 'menu' || activeTab === 'study') && (
        <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />
      )}

      {/* Game Tab Content */}
      {activeTab === 'game' && (
        <>
          {gameState === 'menu' && (
            <MenuScreen
              globalStats={globalStats}
              onStartGame={() => setGameState('domainSelect')}
              onViewStats={() => setGameState('stats')}
              soundEnabled={soundEnabled}
              onToggleSound={() => setSoundEnabled(!soundEnabled)}
            />
          )}

          {gameState === 'domainSelect' && (
            <DomainSelect
              globalStats={globalStats}
              onSelectDomain={startDomain}
              onBack={() => setGameState('menu')}
            />
          )}

          {gameState === 'playing' && currentQuestions.length > 0 && (
            <QuestionScreen
              domain={selectedDomain}
              questions={currentQuestions}
              currentIndex={currentQuestionIndex}
              selectedAnswer={selectedAnswer}
              showExplanation={showExplanation}
              sessionStats={sessionStats}
              showParticles={showParticles}
              onAnswer={handleAnswer}
              onNext={nextQuestion}
              onQuit={() => setGameState('menu')}
            />
          )}

          {gameState === 'results' && (
            <ResultsScreen
              domain={selectedDomain}
              sessionStats={sessionStats}
              totalQuestions={currentQuestions.length}
              onRetry={() => startDomain(selectedDomain.id)}
              onSelectDomain={() => setGameState('domainSelect')}
              onMainMenu={() => setGameState('menu')}
            />
          )}

          {gameState === 'stats' && (
            <StatsScreen
              globalStats={globalStats}
              onBack={() => setGameState('menu')}
              onReset={resetStats}
            />
          )}
        </>
      )}

      {/* Study Guide Tab Content */}
      {activeTab === 'study' && (
        <StudyGuide onBack={() => setActiveTab('game')} />
      )}
    </div>
  );
}

// Main App with Auth Gate
function AppContent() {
  const { isAuthenticated, loading, authChecked } = useAuth();

  // Show loading while checking auth
  if (loading || !authChecked) {
    return <LoadingScreen />;
  }

  // Require authentication - show auth screen if not logged in
  if (!isAuthenticated) {
    return <AuthScreen hubUrl={HUB_URL} />;
  }

  // User is authenticated, show the game
  return <GameContent />;
}

// App wrapper with AuthProvider
function App() {
  return (
    <AuthProvider requireAuth={true}>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
