import React, { useState } from "react";
import "./App.css";
import GolfGame from "./components/GolfGame";
import StartScreen from "./components/StartScreen";
import { useGolfCourses } from "./hooks/useGolfCourses";

const App: React.FC = () => {
  const [gameState, setGameState] = useState<{
    isPlaying: boolean;
    courseId: string | null;
    holeId: string | null;
    seed: number | null;
  }>({
    isPlaying: false,
    courseId: null,
    holeId: null,
    seed: null,
  });

  const { updateHoleProgress } = useGolfCourses();

  const handleStartGame = (courseId: string, holeId: string, seed: number) => {
    setGameState({
      isPlaying: true,
      courseId,
      holeId,
      seed,
    });
  };

  const handleGameComplete = (score: number) => {
    if (gameState.courseId && gameState.holeId) {
      updateHoleProgress(gameState.courseId, gameState.holeId, score);
    }
    setGameState({
      ...gameState,
      isPlaying: false,
    });
  };

  const handleBackToMenu = () => {
    setGameState({
      ...gameState,
      isPlaying: false,
    });
  };

  return (
    <div className="App">
      {gameState.isPlaying && gameState.seed !== null ? (
        <GolfGame
          seed={gameState.seed}
          onGameComplete={handleGameComplete}
          onBackToMenu={handleBackToMenu}
        />
      ) : (
        <StartScreen onStartGame={handleStartGame} />
      )}
    </div>
  );
};

export default App;
