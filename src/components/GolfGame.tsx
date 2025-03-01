import React, { useState, useEffect } from "react";
import "./GolfGame.css";

// TypeScript Enums and Types
enum CellType {
  EMPTY = 0,
  FAIRWAY = 1,
  GREEN = 2,
  TREE = 3,
  PLAYER = 4,
  HOLE = 5,
  FLOWER = 6,
  BUNKER = 7,
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
type Power = 1 | 3 | 6 | 0;

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
  const [selectedPower, setSelectedPower] = useState<Power>(0);
  const [gameComplete, setGameComplete] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(false);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [clouds, setClouds] = useState<
    { x: number; y: number; size: number; speed: number }[]
  >([]);
  const [birds, setBirds] = useState<
    { x: number; y: number; direction: number }[]
  >([]);
  const [animations, setAnimations] = useState<
    { x: number; y: number; type: string }[]
  >([]);

  // Initialize game with provided seed
  useEffect(() => {
    generateCourse(seed);
    generateAmbientElements(seed);
  }, [seed]);

  // Generate ambient elements like clouds and birds
  const generateAmbientElements = (seedValue: number) => {
    let seed = seedValue;

    // Generate 3-5 clouds
    const numClouds = seededRandom(seed++, 3, 5);
    const newClouds = [];

    for (let i = 0; i < numClouds; i++) {
      newClouds.push({
        x: seededRandom(seed++, WIDTH * 50),
        y: seededRandom(seed++, 100, 200),
        size: seededRandom(seed++, 50, 100),
        speed: seededRandom(seed++, 5, 15) / 10,
      });
    }

    setClouds(newClouds);

    // Occasionally add birds
    if (seededRandom(seed++, 10) > 6) {
      const numBirds = seededRandom(seed++, 1, 3);
      const newBirds = [];

      for (let i = 0; i < numBirds; i++) {
        newBirds.push({
          x: seededRandom(seed++, WIDTH * 50),
          y: seededRandom(seed++, 50, 150),
          direction: seededRandom(seed++, 2) === 0 ? -1 : 1,
        });
      }

      setBirds(newBirds);
    }
  };

  // Animate clouds
  useEffect(() => {
    const interval = setInterval(() => {
      setClouds((prevClouds) =>
        prevClouds.map((cloud) => ({
          ...cloud,
          x: (cloud.x + cloud.speed) % (WIDTH * 50 + cloud.size),
        })),
      );

      setBirds((prevBirds) =>
        prevBirds.map((bird) => ({
          ...bird,
          x: bird.x + bird.direction * 2,
        })),
      );
    }, 100);

    return () => clearInterval(interval);
  }, [WIDTH]);

  // Calculate valid moves when power changes
  useEffect(() => {
    if (selectedPower > 0 && playerPosition) {
      const newValidMoves = calculateValidMoves();
      setValidMoves(newValidMoves);
    } else {
      setValidMoves([]);
    }
  }, [selectedPower, playerPosition]);

  // Function to calculate all valid positions the player could move to
  const calculateValidMoves = (): Position[] => {
    if (!playerPosition || selectedPower === 0) return [];

    const [currentX, currentY] = playerPosition;
    const validMoves: Position[] = [];

    // All 8 directions
    const directions: [number, number][] = [
      [0, -1], // up
      [0, 1], // down
      [-1, 0], // left
      [1, 0], // right
      [-1, -1], // up-left
      [1, -1], // up-right
      [-1, 1], // down-left
      [1, 1], // down-right
    ];

    // Check each direction
    for (const [dx, dy] of directions) {
      const newX = currentX + dx * selectedPower;
      const newY = currentY + dy * selectedPower;

      // Check if this is a valid move
      if (isValidMove(newX, newY)) {
        validMoves.push([newX, newY]);
      }
    }

    return validMoves;
  };

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

    // Add decorative elements like flowers
    addDecorations(newGrid, seedValue);

    // Mark player and hole positions
    newGrid[playerY][playerX] = CellType.PLAYER;
    newGrid[holeY][holeX] = CellType.HOLE;

    setGrid(newGrid);
    setPlayerPosition([playerX, playerY]);
    setHolePosition([holeX, holeY]);
    setStrokes(0);
    setGameComplete(false);
    setValidMoves([]);
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

    // Add some bunkers around the green for challenge
    for (let i = 0; i < 3; i++) {
      const angle = seededRandom(seed++, 360) * (Math.PI / 180);
      const distance = seededRandom(seed++, 2, 4);
      const bunkerX = Math.round(endX + Math.cos(angle) * distance);
      const bunkerY = Math.round(endY + Math.sin(angle) * distance);

      if (bunkerX >= 0 && bunkerX < WIDTH && bunkerY >= 0 && bunkerY < HEIGHT) {
        if (
          grid[bunkerY][bunkerX] !== CellType.GREEN &&
          grid[bunkerY][bunkerX] !== CellType.HOLE
        ) {
          grid[bunkerY][bunkerX] = CellType.BUNKER;
        }
      }
    }
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

  // Add decorative elements
  const addDecorations = (grid: Grid, seedValue: number): void => {
    let seed = seedValue;

    // Add flowers along the fairway edges
    for (let y = 0; y < HEIGHT; y++) {
      for (let x = 0; x < WIDTH; x++) {
        if (grid[y][x] === CellType.FAIRWAY) {
          // Check if this is an edge cell
          let isEdge = false;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;

              const nx = x + dx;
              const ny = y + dy;

              if (nx >= 0 && nx < WIDTH && ny >= 0 && ny < HEIGHT) {
                if (
                  grid[ny][nx] === CellType.EMPTY ||
                  grid[ny][nx] === CellType.TREE
                ) {
                  isEdge = true;
                }
              }
            }
          }

          if (isEdge && seededRandom(seed++, 100) < 15) {
            grid[y][x] = CellType.FLOWER;
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

    // Add swing animation
    setAnimations([
      ...animations,
      {
        x: currentX,
        y: currentY,
        type: "swing",
      },
    ]);

    // Reset states after moving
    setSelectedPower(0);
    setShowControls(false); // Hide controls after making a move
    setValidMoves([]);

    if (!isValidMove(newX, newY)) return;

    // Update grid
    const newGrid: Grid = JSON.parse(JSON.stringify(grid));
    let isOnGreen = false;

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

      isOnGreen = greenCount > fairwayCount;
      newGrid[currentY][currentX] = isOnGreen
        ? CellType.GREEN
        : CellType.FAIRWAY;
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

  // Select power and show controls
  const handlePowerSelect = (power: Power) => {
    setSelectedPower(power);
    setShowControls(true);
  };

  return (
    <div className="golf-game">
      {/* Ambient Elements */}
      <div className="ambient-container">
        {clouds.map((cloud, index) => (
          <div
            key={`cloud-${index}`}
            className="cloud"
            style={{
              left: `${cloud.x}px`,
              top: `${cloud.y}px`,
              width: `${cloud.size}px`,
              height: `${cloud.size / 2}px`,
            }}
          />
        ))}

        {birds.map((bird, index) => (
          <div
            key={`bird-${index}`}
            className={`bird ${bird.direction < 0 ? "flying-left" : "flying-right"}`}
            style={{
              left: `${bird.x}px`,
              top: `${bird.y}px`,
            }}
          />
        ))}
      </div>

      <div className="game-container">
        <div className="header">
          <button className="back-btn" onClick={onBackToMenu}>
            Back to Menu
          </button>
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
              row.map((cell, x) => {
                // Check if this cell is a valid move destination
                const isValidMove = validMoves.some(
                  ([moveX, moveY]) => moveX === x && moveY === y,
                );

                return (
                  <div
                    key={`${x}-${y}`}
                    style={{
                      aspectRatio: 1,
                      boxShadow: isValidMove
                        ? "inset 0 0 0 3px rgba(255, 211, 42, 1)"
                        : "none",
                    }}
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
                                  : cell === CellType.FLOWER
                                    ? "flower"
                                    : cell === CellType.BUNKER
                                      ? "bunker"
                                      : ""
                      }`}
                  >
                    {cell === CellType.TREE && "🌳"}
                    {cell === CellType.PLAYER && "🏌️"}
                    {cell === CellType.HOLE && "⛳"}
                    {cell === CellType.FLOWER && "🌼"}
                    {cell === CellType.BUNKER && ""}
                  </div>
                );
              }),
            )}
          </div>
        </div>
      </div>

      {/* Power Selector Bar */}
      <div className="power-bar">
        <button
          className={`power-selector ${selectedPower === 1 ? "active" : ""}`}
          onClick={() => handlePowerSelect(1)}
        >
          1
        </button>
        <button
          className={`power-selector ${selectedPower === 3 ? "active" : ""}`}
          onClick={() => handlePowerSelect(3)}
        >
          3
        </button>
        <button
          className={`power-selector ${selectedPower === 6 ? "active" : ""}`}
          onClick={() => handlePowerSelect(6)}
        >
          6
        </button>
      </div>

      {/* Floating Controls */}
      {showControls && (
        <div className="floating-controls">
          <div className="control-pad">
            <div className="control-row">
              <button
                className="direction-button"
                onClick={() => handleMove("upLeft")}
              >
                ↖
              </button>
              <button
                className="direction-button"
                onClick={() => handleMove("up")}
              >
                ↑
              </button>
              <button
                className="direction-button"
                onClick={() => handleMove("upRight")}
              >
                ↗
              </button>
            </div>
            <div className="control-row">
              <button
                className="direction-button"
                onClick={() => handleMove("left")}
              >
                ←
              </button>
              <div className="center-button">
                <span className="power-indicator">{selectedPower}</span>
              </div>
              <button
                className="direction-button"
                onClick={() => handleMove("right")}
              >
                →
              </button>
            </div>
            <div className="control-row">
              <button
                className="direction-button"
                onClick={() => handleMove("downLeft")}
              >
                ↙
              </button>
              <button
                className="direction-button"
                onClick={() => handleMove("down")}
              >
                ↓
              </button>
              <button
                className="direction-button"
                onClick={() => handleMove("downRight")}
              >
                ↘
              </button>
            </div>
          </div>
        </div>
      )}

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
