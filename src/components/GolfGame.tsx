import React, { useState, useEffect } from "react";
import { Dot } from "./Dot";

// TypeScript Enums and Types
enum CellType {
  EMPTY = 0,
  FAIRWAY = 1,
  GREEN = 2,
  TREE = 3,
  PLAYER = 4,
  HOLE = 5,
}

type Position = [number, number]; // [x, y]
type Grid = CellType[][];
type Direction =
  | "up"
  | "down"
  | "left"
  | "right"
  | "upLeft"
  | "upRight"
  | "downLeft"
  | "downRight";
type Power = 1 | 3 | 6;

interface GolfGameProps {
  seed: number;
  onGameComplete: (score: number) => void;
  onBackToMenu: () => void;
}

const GolfGame: React.FC<GolfGameProps> = ({
  seed,
  onGameComplete,
  onBackToMenu,
}) => {
  const WIDTH = 14;
  const HEIGHT = 20;

  const [grid, setGrid] = useState<Grid>(
    Array(HEIGHT)
      .fill(0)
      .map(() => Array(WIDTH).fill(CellType.EMPTY)),
  );
  const [playerPosition, setPlayerPosition] = useState<Position | null>(null);
  const [holePosition, setHolePosition] = useState<Position | null>(null);
  const [strokes, setStrokes] = useState<number>(0);
  const [selectedPower, setSelectedPower] = useState<Power>(1);
  const [gameComplete, setGameComplete] = useState<boolean>(false);
  const [isControlsOpen, setIsControlsOpen] = useState<boolean>(false);

  // Initialize game with provided seed
  useEffect(() => {
    generateCourse(seed);
  }, [seed]);

  // Handle game completion
  useEffect(() => {
    if (gameComplete) {
      // Give time for user to see completion state before modal opens
      setTimeout(() => {
        // Don't automatically go back to menu
      }, 500);
    }
  }, [gameComplete]);

  // Seeded random function
  const seededRandom = (
    seedValue: number,
    max: number,
    min: number = 0,
  ): number => {
    const x = Math.sin(seedValue) * 10000;
    const rand = x - Math.floor(x);
    return Math.floor(rand * (max - min) + min);
  };

  // Procedural generation algorithm
  const generateCourse = (seedValue: number): void => {
    let seed = seedValue;

    // Initialize empty grid
    const newGrid: Grid = Array(HEIGHT)
      .fill(0)
      .map(() => Array(WIDTH).fill(CellType.EMPTY));

    // Generate player position (bottom third)
    const playerY = seededRandom(
      seed++,
      HEIGHT - 5,
      Math.floor((HEIGHT * 2) / 3),
    );
    const playerX = seededRandom(seed++, WIDTH - 4, 2);

    // Generate hole position (top third)
    const holeY = seededRandom(seed++, Math.floor(HEIGHT / 3) - 2, 2);
    const holeX = seededRandom(seed++, WIDTH - 4, 2);

    // Create fairway areas around player and hole
    createFairwayArea(newGrid, playerX, playerY, 1, CellType.FAIRWAY);
    createFairwayArea(newGrid, holeX, holeY, 1, CellType.GREEN);

    // Generate fairway path between player and hole
    generatePath(newGrid, playerX, playerY, holeX, holeY, seedValue);

    // Add trees and other obstacles
    addObstacles(newGrid, seedValue);

    // Mark player and hole positions
    newGrid[playerY][playerX] = CellType.PLAYER;
    newGrid[holeY][holeX] = CellType.HOLE;

    setGrid(newGrid);
    setPlayerPosition([playerX, playerY]);
    setHolePosition([holeX, holeY]);
    setStrokes(0);
    setGameComplete(false);
  };

  // Create a fairway area around a position
  const createFairwayArea = (
    grid: Grid,
    x: number,
    y: number,
    radius: number,
    cellType: CellType,
  ): void => {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const newY = y + dy;
        const newX = x + dx;
        if (newY >= 0 && newY < HEIGHT && newX >= 0 && newX < WIDTH) {
          grid[newY][newX] = cellType;
        }
      }
    }
  };

  // Generate a path between start and end
  const generatePath = (
    grid: Grid,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    seedValue: number,
  ): void => {
    let seed = seedValue;
    let currentX = startX;
    let currentY = startY;

    // Create waypoints for a more interesting path
    const numWaypoints = seededRandom(seed++, 3, 1);
    const waypoints: Position[] = [];

    for (let i = 0; i < numWaypoints; i++) {
      const wpX = seededRandom(seed++, WIDTH - 4, 2);
      const wpY = seededRandom(seed++, HEIGHT - 4, 2);
      waypoints.push([wpX, wpY]);
    }

    // Add ending position as final waypoint
    waypoints.push([endX, endY]);

    // Connect through all waypoints
    for (const [wpX, wpY] of waypoints) {
      while (Math.abs(currentX - wpX) > 1 || Math.abs(currentY - wpY) > 1) {
        // Decide direction
        let xDir = 0;
        let yDir = 0;

        if (currentX < wpX) xDir = 1;
        else if (currentX > wpX) xDir = -1;

        if (currentY < wpY) yDir = 1;
        else if (currentY > wpY) yDir = -1;

        // Sometimes move only in one direction
        if (seededRandom(seed++, 3) === 0) {
          if (seededRandom(seed++, 2) === 0) xDir = 0;
          else yDir = 0;
        }

        // Update position
        if (xDir !== 0) currentX += xDir;
        if (yDir !== 0) currentY += yDir;

        // Ensure within bounds
        currentX = Math.max(0, Math.min(WIDTH - 1, currentX));
        currentY = Math.max(0, Math.min(HEIGHT - 1, currentY));

        // Add fairway at and around current position
        createFairwayArea(grid, currentX, currentY, 1, CellType.FAIRWAY);
      }
    }

    // Add green around the hole
    createFairwayArea(grid, endX, endY, 2, CellType.GREEN);
  };

  // Add trees and obstacles
  const addObstacles = (grid: Grid, seedValue: number): void => {
    let seed = seedValue;
    for (let y = 0; y < HEIGHT; y++) {
      for (let x = 0; x < WIDTH; x++) {
        if (grid[y][x] === CellType.EMPTY) {
          const rand = seededRandom(seed++, 100);
          if (rand < 70) {
            // 70% chance of tree in empty spaces
            grid[y][x] = CellType.TREE;
          }
        }
      }
    }
  };

  // Check if a move is valid
  const isValidMove = (x: number, y: number): boolean => {
    // Check bounds
    if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) {
      return false;
    }

    // Check obstacles (can't move into trees)
    if (grid[y][x] === CellType.TREE) {
      return false;
    }

    return true;
  };

  // Handle player movement
  const handleMove = (direction: Direction): void => {
    setIsControlsOpen(false);
    if (gameComplete || !playerPosition) return;

    const [currentX, currentY] = playerPosition;
    let newX = currentX;
    let newY = currentY;

    // Calculate new position based on direction and power
    switch (direction) {
      case "up":
        newY -= selectedPower;
        break;
      case "down":
        newY += selectedPower;
        break;
      case "left":
        newX -= selectedPower;
        break;
      case "right":
        newX += selectedPower;
        break;
      case "upLeft":
        newX -= selectedPower;
        newY -= selectedPower;
        break;
      case "upRight":
        newX += selectedPower;
        newY -= selectedPower;
        break;
      case "downLeft":
        newX -= selectedPower;
        newY += selectedPower;
        break;
      case "downRight":
        newX += selectedPower;
        newY += selectedPower;
        break;
    }

    if (!isValidMove(newX, newY)) return;

    // Update grid
    const newGrid: Grid = JSON.parse(JSON.stringify(grid));

    // Update previous position
    if (
      holePosition &&
      currentX === holePosition[0] &&
      currentY === holePosition[1]
    ) {
      newGrid[currentY][currentX] = CellType.HOLE;
    } else {
      // Determine terrain under player
      const surroundingCells: CellType[] = [];
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const checkY = currentY + dy;
          const checkX = currentX + dx;
          if (checkY >= 0 && checkY < HEIGHT && checkX >= 0 && checkX < WIDTH) {
            surroundingCells.push(grid[checkY][checkX]);
          }
        }
      }

      const greenCount = surroundingCells.filter(
        (cell) => cell === CellType.GREEN,
      ).length;
      const fairwayCount = surroundingCells.filter(
        (cell) => cell === CellType.FAIRWAY,
      ).length;

      newGrid[currentY][currentX] =
        greenCount > fairwayCount ? CellType.GREEN : CellType.FAIRWAY;
    }

    // Update new position
    newGrid[newY][newX] = CellType.PLAYER;

    setGrid(newGrid);
    setPlayerPosition([newX, newY]);
    setStrokes(strokes + 1);

    // Check if hole is complete
    if (holePosition && newX === holePosition[0] && newY === holePosition[1]) {
      setGameComplete(true);
    }
  };

  return (
    <div className="golf-game">
      <div className="game-container">
        <div className="header">
          <button className="back-btn" onClick={onBackToMenu}>
            Back to Menu
          </button>
          <h1>Grid Golf</h1>
          <div className="score">
            <span>
              Strokes: <strong>{strokes}</strong>
            </span>
          </div>
        </div>

        <div className="game-content">
          {/* Game Board */}
          <div
            className="game-board"
            style={{
              gridTemplateColumns: `repeat(${WIDTH}, 1fr)`,
            }}
          >
            {grid.map((row, y) =>
              row.map((cell, x) => (
                <div
                  key={`${x}-${y}`}
                  style={{ aspectRatio: 1 }}
                  className={`cell ${cell === CellType.EMPTY
                      ? "empty"
                      : cell === CellType.FAIRWAY
                        ? "fairway"
                        : cell === CellType.GREEN
                          ? "green"
                          : cell === CellType.TREE
                            ? "tree"
                            : cell === CellType.PLAYER
                              ? "player"
                              : cell === CellType.HOLE
                                ? "hole"
                                : ""
                    }`}
                >
                  {cell === CellType.TREE && "🌲"}
                  {cell === CellType.PLAYER && "🏌️"}
                  {cell === CellType.HOLE && "⛳"}
                  {(cell === CellType.GREEN ||
                    cell === CellType.FAIRWAY ||
                    cell === CellType.EMPTY) && <Dot size={8} />}
                </div>
              )),
            )}
          </div>

          <div
            className="controls-toggle"
            onClick={() => setIsControlsOpen(true)}
          >
            Open Controls
          </div>

          {/* Controls */}
          <div className={isControlsOpen ? "controls open" : "controls"}>
            <div className="direction-select">
              <h3>Direction</h3>
              <div className="direction-grid" style={{ aspectRatio: 1 }}>
                <button onClick={() => handleMove("upLeft")}>↖</button>
                <button onClick={() => handleMove("up")}>↑</button>
                <button onClick={() => handleMove("upRight")}>↗</button>

                <button onClick={() => handleMove("left")}>←</button>
                <div className="empty-cell"></div>
                <button onClick={() => handleMove("right")}>→</button>

                <button onClick={() => handleMove("downLeft")}>↙</button>
                <button onClick={() => handleMove("down")}>↓</button>
                <button onClick={() => handleMove("downRight")}>↘</button>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                alignItems: "flex-end",
                gap: "0.5rem",
              }}
            >
              <div className="power-select">
                <h3>Power</h3>
                <div className="power-buttons">
                  <button
                    className={selectedPower === 1 ? "active" : ""}
                    onClick={() => setSelectedPower(1)}
                  >
                    1
                  </button>
                  <button
                    className={selectedPower === 3 ? "active" : ""}
                    onClick={() => setSelectedPower(3)}
                  >
                    3
                  </button>
                  <button
                    className={selectedPower === 6 ? "active" : ""}
                    onClick={() => setSelectedPower(6)}
                  >
                    6
                  </button>
                </div>
              </div>

              <div className="back-to-menu-btn" onClick={onBackToMenu}>
                Back to Menu
              </div>
            </div>

            <div
              className="close-controls-btn"
              onClick={() => setIsControlsOpen(false)}
            >
              Close Controls
            </div>
          </div>
        </div>
      </div>

      {/* Completion Modal */}
      {gameComplete && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Hole Complete!</h2>
            <p>You completed the hole in {strokes} strokes.</p>
            <div className="modal-buttons">
              <button
                onClick={() => {
                  onGameComplete(strokes);
                }}
              >
                Back to Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GolfGame;
