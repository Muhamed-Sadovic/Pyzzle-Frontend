import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./PuzzleBoard.css";
const url = "http://127.0.0.1:8000";

// const images = {
//   1: "/assets/number-1019717_1280.jpg",
//   2: "/assets/number-1019719_1280.jpg",
//   3: "/assets/number-1019720_1280.jpg",
//   4: "/assets/number-1019721_1280.jpg",
//   5: "/assets/number-1019722_1280.jpg",
//   6: "/assets/number-1019724_1280.jpg",
//   7: "/assets/number-1019725_1280.jpg",
//   8: "/assets/number-1019726_1280.jpg",
//   9: "/assets/number-1019727_1280.jpg",
//   0: null,
// };

// const generateRandomTiles = () => {
//   let tiles;
//   do {
//     tiles = Array.from({ length: 9 }, (_, i) => i);
//     for (let i = tiles.length - 1; i > 0; i--) {
//       const j = Math.floor(Math.random() * (i + 1));
//       [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
//     }
//   } while (!isSolvable(tiles));
//   return tiles;
// };

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
  console.log("inve " + inversions);
  return inversions % 2 === 0;
};

const convertToMatrix = (tiles, matrixSize) => {
  const matrix = [];
  for (let i = 0; i < tiles.length; i += matrixSize) {
    matrix.push(tiles.slice(i, i + matrixSize));
  }
  return matrix;
};

const generateGoalState = (matrixSize) => {
  const goalState = [];
  let value = 1;

  for (let row = 0; row < matrixSize; row++) {
    const rowArray = [];
    for (let col = 0; col < matrixSize; col++) {
      if (value === matrixSize * matrixSize) {
        rowArray.push(0);
      } else {
        rowArray.push(value);
      }
      value++;
    }
    goalState.push(rowArray);
  }

  return goalState;
};

const generateFinalState = (matrixSize) => {
  const size = matrixSize ** 2;
  return Array.from({ length: size }, (_, i) => (i + 1) % size);
};

const PuzzleBoard = () => {
  const [tiles, setTiles] = useState([]);
  const [matrixSize, setMatrixSize] = useState(3);
  const [image, setImage] = useState(null);
  const [tileImages, setTileImages] = useState([]);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState("");
  const [selectedHeuristic, setSelectedHeuristic] = useState("");
  const [steps, setSteps] = useState(0);
  const [solutionSteps, setSolutionSteps] = useState([]);
  const [totalSteps, setTotalSteps] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const stepIndex = useRef(0);
  const isPausedRef = useRef(isPaused);
  const animationIntervalRef = useRef(null);
  const [showHeuristicButtons, setShowHeuristicButtons] = useState(false);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMatrixSizeChange = (event) => {
    const size = parseInt(event.target.value, 10);
    setMatrixSize(size);
  };

  const sliceImage = () => {
    if (!image) return;

    const img = new Image();
    img.src = image;

    img.onload = () => {
      const gridSize = 500;
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.width = gridSize;
      canvas.height = gridSize;

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(
        img,
        0,
        0,
        img.width,
        img.height,
        0,
        0,
        gridSize,
        gridSize
      );

      // Podela slike na pločice
      const tileSize = Math.floor(gridSize / matrixSize);
      const newTileImages = [];
      const newTiles = [];

      for (let row = 0; row < matrixSize; row++) {
        for (let col = 0; col < matrixSize; col++) {
          if (row === matrixSize - 1 && col === matrixSize - 1) {
            newTileImages.push(null); // Prazna pločica
            newTiles.push(0);
            continue;
          }

          const tileCanvas = document.createElement("canvas");
          const tileContext = tileCanvas.getContext("2d");
          tileCanvas.width = tileSize;
          tileCanvas.height = tileSize;

          tileContext.drawImage(
            canvas,
            col * tileSize,
            row * tileSize,
            tileSize,
            tileSize,
            0,
            0,
            tileSize,
            tileSize
          );

          newTileImages.push(tileCanvas.toDataURL());
          newTiles.push(row * matrixSize + col + 1);
        }
      }

      const shuffleArray = (array) => {
        do {
          for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
          }
        } while (!isSolvable(array));
      };

      shuffleArray(newTiles);

      setTileImages(newTileImages);
      setTiles(newTiles);
    };
  };

  useEffect(() => {
    if (image) {
      sliceImage();
    }
    setSteps(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image, matrixSize]);

  const handleAlgorithmSelection = (algorithm) => {
    setSelectedAlgorithm(algorithm);
    if (algorithm === "a-star" || algorithm === "best-first") {
      setShowHeuristicButtons(true);
    } else {
      setShowHeuristicButtons(false);
    }
  };

  const handleHeuristicSelection = (heuristic) => {
    setSelectedHeuristic(heuristic);
  };

  const runAlgorithm = async (algorithmEndpoint, heuristic) => {
    try {
      const payload = {
        start_state: convertToMatrix(tiles, matrixSize),
        goal_state: generateGoalState(matrixSize),
        heuristic: heuristic,
      };

      console.log("jaaaa", payload.start_state);
      console.log("oooon", payload.goal_state);
      console.log("heuuu:", payload.heuristic);
      console.log(payload);

      const response = await axios.post(
        `${url}/${algorithmEndpoint}/`,
        payload
      );
      console.log(response.data.steps);
      if (response.data.steps) {
        setSolutionSteps(response.data.steps);
        setTotalSteps(response.data.moves);
      }
    } catch (error) {
      console.error(
        "Greska pri pokretanju algoritma:",
        error.response?.data || error.message
      );
      alert("Proveri backend.");
    }
  };

  const startGame = () => {
    // if(!image){
    //   alert("Upload an image!")
    //   return;
    // }
    // if(selectedAlgorithm === ""){
    //   alert("Choose an algorithm!")
    //   return;
    // }
    // if (selectedAlgorithm !== "bfs" && selectedHeuristic === "") {
    //   alert("Choose a heuristic!");
    //   return;
    // }
    runAlgorithm(selectedAlgorithm, selectedHeuristic);
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
          setIsCompleted(true);
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
    setTiles(generateFinalState(matrixSize));
    setSteps(totalSteps);
    setSolutionSteps([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && isAnimating) {
      finishAnimation();
      setIsCompleted(true);
      //alert("The end!")
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
    setSolutionSteps([]);
    setShowHeuristicButtons(false);
    setSelectedHeuristic("");
    setSelectedAlgorithm("");
    setIsAnimating(false);
    setIsCompleted(false);
    setTotalSteps(0);
    setSteps(0);
    stepIndex.current = 0;
    if (image) {
      sliceImage();
    }
  };

  const handleTileClick = (index) => {
    const emptyIndex = tiles.indexOf(0);
    const row = Math.floor(index / matrixSize);
    const col = index % matrixSize;
    const emptyRow = Math.floor(emptyIndex / matrixSize);
    const emptyCol = emptyIndex % matrixSize;
    if (
      (row === emptyRow && Math.abs(col - emptyCol) === 1) ||
      (col === emptyCol && Math.abs(row - emptyRow) === 1)
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
    <div className="main-container">
      <div className="instruction-panel">
        <h2>Instructions</h2>
        <p>1. Upload an image.</p>
        <p>2. Choose an algorithm and heuristic.</p>
        <p>3. Click "Start" to begin solving the puzzle.</p>
        <p>Click "New Game" to shuffle the tiles and begin a new puzzle.</p>
        <p>Click "Pause" to pause or continue the game.</p>
        <p>Press "Enter" to immediately end the game.</p>
        {image && (
          <div className="goal-image-container">
            <h3>Goal Image</h3>
            <img src={image} alt="goal-image" className="goal-image" />
          </div>
        )}
      </div>
      <div className="pyzzle-container">
        <h1 className="title">Pyzzle</h1>
        <div className="input-select-wrapper">
          <div className="input-file-wrapper">
            <input
              type="file"
              accept="image/*"
              className="input-file"
              id="file-upload"
              onChange={handleImageUpload}
            />
            <label htmlFor="file-upload" className="input-file-label">
              Upload Image
            </label>
          </div>
          <select
            value={matrixSize}
            onChange={handleMatrixSizeChange}
            className="custom-select"
          >
            {[3, 4, 5].map((size) => (
              <option key={size} value={size}>
                {size}x{size}
              </option>
            ))}
          </select>
        </div>
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
          {showHeuristicButtons && (
            <div className="heuristic-buttons">
              <button
                onClick={() => handleHeuristicSelection("manhattan")}
                className={`heuristic-button ${
                  selectedHeuristic === "manhattan" ? "selected" : ""
                }`}
              >
                Manhattan
              </button>
              <button
                onClick={() => handleHeuristicSelection("hamming")}
                className={`heuristic-button ${
                  selectedHeuristic === "hamming" ? "selected" : ""
                }`}
              >
                Hamming
              </button>
            </div>
          )}
          <div
            className="pyzzle-board"
            style={
              image
                ? {
                    gridTemplateColumns: `repeat(${matrixSize}, 1fr)`,
                    gridTemplateRows: `repeat(${matrixSize}, 1fr)`,
                    width: "500px",
                    height: "500px",
                  }
                : {
                    display: "flex",
                    justifyContent: "center",
                    width: "500px",
                    height: "500px",
                    alignItems: "center",
                  }
            }
          >
            {image ? (
              tiles.map((tile, index) => (
                <div
                  key={index}
                  className={`tile ${tile === 0 ? "empty" : ""}`}
                  onClick={() => handleTileClick(index)}
                >
                  {tile !== 0 && tileImages[tile - 1] && (
                    <img
                      src={tileImages[tile - 1]}
                      alt={`Tile ${tile}`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  )}
                </div>
              ))
            ) : (
              <p className="upload-image">Upload an image</p>
            )}
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
              disabled={isAnimating}
              onClick={startGame}
              style={{ backgroundColor: "red" }}
            >
              Start
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
    </div>
  );
};

export default PuzzleBoard;
