import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./PuzzleBoard.css";
const url = "http://127.0.0.1:8000";

const images = {
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
  const inversions = tiles.reduce((acc, elem, i) => {
    if (elem === 0) return acc;
    for (let j = i + 1; j < tiles.length; j++) {
      if (tiles[j] !== 0 && tiles[i] > tiles[j]) {
        acc++;
      }
    }
    return acc;
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

const convertToMatrix = (tiles) => {
  return [tiles.slice(0, 3), tiles.slice(3, 6), tiles.slice(6, 9)];
};

const PuzzleBoard = () => {
  const [tiles, setTiles] = useState(generateRandomTiles());
  const [selectedAlgorithm, setSelectedAlgorithm] = useState("");
  const [steps, setSteps] = useState(0);
  const [solutionSteps, setSolutionSteps] = useState([]);
  const [totalSteps, setTotalSteps] = useState(0);
  //const [algorithm, setAlgorithm] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const stepIndex = useRef(0);
  const isPausedRef = useRef(isPaused);
  const animationIntervalRef = useRef(null);
  const finalState = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  const setFinalState = () => {
    setTiles(finalState);
    setIsCompleted(true);
  };

  const handleAlgorithmSelection = (algorithm) => {
    setSelectedAlgorithm(algorithm);
    runAlgorithm(algorithm);
  };

  const runAlgorithm = async (algorithmEndpoint) => {
    try {
      const payload = {
        start_state: convertToMatrix(tiles),
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
      console.log(response.data.steps);
      if (response.data.steps) {
        setSolutionSteps(response.data.steps);
        setTotalSteps(response.data.moves);
      } else {
        alert("Resenje nije pronadjeno.");
      }
    } catch (error) {
      console.error(
        "Greska pri pokretanju algoritma:",
        error.response?.data || error.message
      );
      alert("Proveri backend.");
    }
  };

  const animateSolution = () => {
    setIsAnimating(true);
    setIsPaused(false);
    animationIntervalRef.current = setInterval(() => {
      if (!isPausedRef.current) {
        if (stepIndex.current < solutionSteps.length) {
          setTiles(solutionSteps[stepIndex.current].flat());
          stepIndex.current += 1;
          setSteps((prevStep) => prevStep + 1);
        } else {
          clearInterval(animationIntervalRef.current);
          animationIntervalRef.current = null;
          setIsAnimating(false);
          setFinalState();
          stepIndex.current = 0;
        }
      }
    }, 700);
  };

  const togglePause = () => {
    setIsPaused((prev) => !prev);
    if (isPausedRef.current) {
      animateSolution();
    } else {
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
    setTiles(finalState);
    const totalSteps = solutionSteps.length;
    setSteps(totalSteps);
    setSolutionSteps([]);
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

  useEffect(() => {
    if (solutionSteps.length > 0) {
      animateSolution();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solutionSteps]);

  const resetGame = () => {
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
      animationIntervalRef.current = null;
    }
    setTiles(generateRandomTiles());
    setSolutionSteps([]);
    //setAlgorithm("");
    setIsAnimating(false);
    setIsCompleted(false);
    setTotalSteps(0);
    setSteps(0);
    setSelectedAlgorithm("");
    stepIndex.current = 0;
  };

  const handleTileClick = (index) => {
    console.log(index);
    const emptyIndex = tiles.indexOf(0);
    const row = Math.floor(index / 3);
    const col = index % 3;
    const emptyRow = Math.floor(emptyIndex / 3);
    const emptyCol = emptyIndex % 3;
    if (
      (row === emptyRow && Math.abs(col - emptyCol) === 1) ||
      (col === emptyCol && Math.abs(row - emptyRow) === 1)
    ) {
      const newTiles = [...tiles];
      console.log(newTiles);
      [newTiles[index], newTiles[emptyIndex]] = [
        newTiles[emptyIndex],
        newTiles[index],
      ];
      setTiles(newTiles);
      setSteps((prevStepCount) => prevStepCount + 1);
    }
  };

  return (
    <div className="pyzzle-container">
      <h1 className="title">Pyzzle</h1>
      <p className="subtitle">Choose an algorithm</p>
      <div className="pyzzle-board-container">
        <div className="algorithm-buttons">
          <button
            onClick={() => handleAlgorithmSelection("bfs")}
            className={`algorithm-button ${
              selectedAlgorithm === "bfs" ? "selected" : ""
            }`}
            disabled={isAnimating || isCompleted}
          >
            BFS
          </button>
          <button
            onClick={() => handleAlgorithmSelection("best-first")}
            className={`algorithm-button ${
              selectedAlgorithm === "best-first" ? "selected" : ""
            }`}
            disabled={isAnimating || isCompleted}
          >
            Best-first
          </button>
          <button
            onClick={() => handleAlgorithmSelection("a-star")}
            className={`algorithm-button ${
              selectedAlgorithm === "a-star" ? "selected" : ""
            }`}
            disabled={isAnimating || isCompleted}
          >
            A*
          </button>
        </div>
        <div className="pyzzle-board">
          {tiles.map((tile, index) => (
            <div
              key={index}
              className={`tile ${tile === 0 ? "empty" : ""}`}
              onClick={() => handleTileClick(index)}
            >
              {tile !== 0 && <img src={images[tile]} alt={`Tile ${tile}`} />}
            </div>
          ))}
        </div>
        <div className="pyzzle-buttons">
          <button
            className="pyzzle-buttons-button"
            onClick={resetGame}
            disabled={isAnimating}
          >
            New Game
          </button>
          <button
            className="pyzzle-buttons-button"
            onClick={togglePause}
            disabled={!isAnimating}
          >
            {isPaused ? "Resume" : "Pause"}
          </button>
        </div>
        <div className="pyzzle-steps">
          <p>
            Step: {steps} / {totalSteps}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PuzzleBoard;
