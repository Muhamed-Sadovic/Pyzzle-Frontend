import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./PuzzleBoard.css";
const url = "http://127.0.0.1:8000";

const tileImages = {
  1: "/assets/number-1019717_1280.jpg",
  2: "/assets/number-1019719_1280.jpg",
  3: "/assets/number-1019720_1280.jpg",
  4: "/assets/number-1019721_1280.jpg",
  5: "/assets/number-1019722_1280.jpg",
  6: "/assets/number-1019724_1280.jpg",
  7: "/assets/number-1019725_1280.jpg",
  8: "/assets/number-1019726_1280.jpg",
  9: "/assets/number-1019727_1280.jpg",
  0: null,
};

const isSolvable = (tiles) => {
  const inversions = tiles.reduce((count, current, i) => {
    if (current === 0) return count;
    for (let j = i + 1; j < tiles.length; j++) {
      if (tiles[j] !== 0 && tiles[i] > tiles[j]) {
        count++;
      }
    }
    return count;
  }, 0);
  return inversions % 2 === 0;
};

const generateRandomTiles = () => {
  let tiles;
  do {
    tiles = Array.from({ length: 9 }, (_, i) => i);
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }
  } while (!isSolvable(tiles));
  return tiles;
};

const convertTilesToMatrix = (tiles) => {
  return [tiles.slice(0, 3), tiles.slice(3, 6), tiles.slice(6, 9)];
};

const PuzzleBoard = () => {
  const [tiles, setTiles] = useState(generateRandomTiles());
  const [solutionSteps, setSolutionSteps] = useState([]);
  //const [algorithm, setAlgorithm] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [steps, setSteps] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(isPaused);
  const animationIntervalRef = useRef(null);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  const setFinalState = () => {
    const finalState = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    setTiles(finalState);
    setIsCompleted(true);
  };

  // Animacija korak po korak
  const animateSolution = () => {
    setIsAnimating(true);
    setIsPaused(false);
    let stepIndex = 0;
    animationIntervalRef.current = setInterval(() => {
      if (!isPausedRef.current) {
        // Koristi isPausedRef za proveru pauze
        if (stepIndex < solutionSteps.length) {
          setTiles(solutionSteps[stepIndex].flat());
          stepIndex++;
          setSteps((prevStepCount) => prevStepCount + 1);
        } else {
          clearInterval(animationIntervalRef.current);
          animationIntervalRef.current = null;
          setIsAnimating(false);
          setFinalState();
        }
      }
    }, 700);
  };

  const togglePause = () => {
    setIsPaused((prev) => !prev);
    if (isPausedRef.current) {
      // Ako je trenutno pauzirano, pokreni interval
      animateSolution();
    } else {
      // Ako nije pauzirano, pauziraj interval
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
      }
    }
  };

  const finishAnimation = () => {
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
      animationIntervalRef.current = null;
    }
    setIsAnimating(false);
    setTiles([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const totalSteps = solutionSteps.length;
    setSteps(totalSteps);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && isAnimating) {
      finishAnimation();
      setIsCompleted(true);
    }
  };
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAnimating]);

  // Funkcija za pokretanje algoritma
  const runAlgorithm = async (algorithmEndpoint) => {
    try {
      const payload = {
        start_state: convertTilesToMatrix(tiles),
        goal_state: [
          [1, 2, 3],
          [4, 5, 6],
          [7, 8, 0],
        ],
      };

      const response = await axios.post(
        `${url}/${algorithmEndpoint}/`,
        payload
      );

      if (response.data.steps) {
        setSolutionSteps(response.data.steps);
        //setAlgorithm(algorithmEndpoint.toUpperCase());
      } else {
        alert("Rešenje nije pronađeno.");
      }
    } catch (error) {
      console.error(
        "Greška pri pokretanju algoritma:",
        error.response?.data || error.message
      );
      alert("Došlo je do greške. Proveri backend.");
    } finally {
    }
  };

  useEffect(() => {
    if (solutionSteps.length > 0) {
      animateSolution();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solutionSteps]);

  const resetGame = () => {
    setTiles(generateRandomTiles());
    setSolutionSteps([]);
    //setAlgorithm("");
    setIsAnimating(false);
    setIsCompleted(false);
    setSteps(0);
  };

  const handleTileClick = (index) => {
    const emptyIndex = tiles.indexOf(0);
    const row = Math.floor(index / 3);
    const col = index % 3;
    const emptyRow = Math.floor(emptyIndex / 3);
    const emptyCol = emptyIndex % 3;

    // Proveri da li je potez validan
    if (
      (row === emptyRow && Math.abs(col - emptyCol) === 1) || // Susedna kolona
      (col === emptyCol && Math.abs(row - emptyRow) === 1) // Susedni red
    ) {
      const newTiles = [...tiles];
      [newTiles[index], newTiles[emptyIndex]] = [
        newTiles[emptyIndex],
        newTiles[index],
      ];
      setTiles(newTiles);
      setSteps((prevStepCount) => prevStepCount + 1);
    }
  };

  return (
    <div className="puzzle-container">
      <h1 className="title">Pyzzle</h1>
      <div className="puzzle-board-container">
        <div className="algorithm-buttons">
          <button
            onClick={() => runAlgorithm("bfs")}
            className="algorithm-button"
            disabled={isAnimating || isCompleted}
          >
            BFS
          </button>
          <button
            onClick={() => runAlgorithm("best-first")}
            className="algorithm-button"
            disabled={isAnimating || isCompleted}
          >
            Best-first
          </button>
          <button
            onClick={() => runAlgorithm("a-star")}
            className="algorithm-button"
            disabled={isAnimating || isCompleted}
          >
            A*
          </button>
        </div>
        <div className="puzzle-board">
          {tiles.map((tile, index) => (
            <div
              key={index}
              className={`tile ${tile === 0 ? "empty" : ""}`}
              onClick={() => handleTileClick(index)}
            >
              {tile !== 0 && (
                <img
                  src={tileImages[tile]}
                  alt={`Tile ${tile}`}
                  className="tile-image"
                />
              )}
            </div>
          ))}
        </div>
        <div className="puzzle-buttons">
          <button
            className="puzzle-buttons-button"
            onClick={resetGame}
            disabled={isAnimating}
          >
            New Game
          </button>
          <button
            className="puzzle-buttons-button"
            onClick={togglePause}
            disabled={!isAnimating}
          >
            {isPaused ? "Resume" : "Pause"}
          </button>
        </div>
        <div className="puzzle-steps">
          <p>Step: {steps}</p>
        </div>
      </div>
    </div>
  );
};

export default PuzzleBoard;
