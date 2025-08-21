import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Logo from '../assets/logoo.png';
import io from "socket.io-client";
import styled from "styled-components";
import Timer from "./Timer";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "./grid.module.css";

const socket = io("http://localhost:8000", {
  withCredentials: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const scoreReader = (array, ind) => {
  let x = 0,
    y = 0;
  for (let i = 0; i < array.length; i++) {
    if (array[i] === "P") x++;
    else if (array[i] === "C") y++;
  }
  return ind === "P" ? x : y;
};

const Grid = ({ handleLogout }) => {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timerStart, setTimerStart] = useState(null);
  const [timerKey, setTimerKey] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(null);
  const [timerActive, setTimerActive] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [cellOwnership, setCellOwnership] = useState(Array(25).fill(null));
  const [playerScore, setPlayerScore] = useState(0);
  const [computerScore, setComputerScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [usedCells, setUsedCells] = useState([]);
  const [currentCell, setCurrentCell] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [players, setPlayers] = useState([]);
  const [currentTurn, setCurrentTurn] = useState(null);

  const user = JSON.parse(localStorage.getItem("quizgrid-user"));

  const api = "https://the-trivia-api.com/v2/questions";

  useEffect(() => {
    if (!user || !user._id) {
      console.error("No user or userId found in localStorage");
      navigate("/login");
      return;
    }

    if (!gameStarted && !quizFinished) {
      socket.emit("joinRoom", {
        roomId,
        userId: user._id,
        username: user.username,
      });
    }

    socket.on(
      "gameStarted",
      ({
        players: initialPlayers,
        currentTurn: initialTurn,
        cellOwnership: initialOwnership,
      }) => {
        setLoading(false);
        setGameStarted(true);
        setPlayers(initialPlayers);
        setCurrentTurn(initialTurn);
        setCellOwnership(initialOwnership);
        toast.success("Game started with both players!", { autoClose: 500 });
      }
    );

    socket.on(
      "updatePlayers",
      ({
        players: updatedPlayers,
        currentTurn: updatedTurn,
        cellOwnership: updatedOwnership,
      }) => {
        setPlayers(updatedPlayers);
        setCurrentTurn(updatedTurn);
        setCellOwnership(updatedOwnership);
        setPlayerScore(scoreReader(updatedOwnership, "P"));
        setComputerScore(scoreReader(updatedOwnership, "C"));
      }
    );

    socket.on("updateTurn", ({ currentTurn: updatedTurn }) => {
      console.log("Received updateTurn:", updatedTurn);
      setCurrentTurn(updatedTurn);
      setQuizData(null);
      setSelectedAnswer(null);
      setIsAnswerCorrect(null);
      setIsAnswered(false);
      setTimerActive(false);
      setTimerStart(null);
    });

    socket.on("cellClick", ({ index, currentTurn: turn }) => {
      setCurrentCell(index);
    });

    socket.on("updateOwnership", ({ cellIndex, owner }) => {
      const updated = [...cellOwnership];
      updated[cellIndex] = owner;
      setCellOwnership(updated);
      setPlayerScore(scoreReader(updated, "P"));
      setComputerScore(scoreReader(updated, "C"));
    });

    socket.on(
      "questionFetched",
      ({ question, options, currentTurn: turn, correctAnswer, timerStart }) => {
        setQuizData({
          question: { text: question },
          shuffledAnswers: options,
          correctAnswer,
        });
        setTimerStart(timerStart);
        setTimerActive(true);
        setTimerKey((prevKey) => prevKey + 1);
        setIsAnswered(false);
        setSelectedAnswer(null);
        setIsAnswerCorrect(null);
      }
    );

    socket.on("answerSubmitted", ({ selectedAnswer, isCorrect, correctAnswer }) => {
      console.log("Answer Submitted:", { selectedAnswer, isCorrect, correctAnswer });
      setSelectedAnswer(selectedAnswer);
      setIsAnswerCorrect(isCorrect);
      setIsAnswered(true);
      setTimerActive(false);
    });

    socket.on("gameOver", ({ winner, finalScores, message }) => {
      setQuizFinished(true);
      setGameStarted(false);
      setPlayers(finalScores);
      setCellOwnership(
        finalScores[0].userId === winner
          ? Array(25).fill("P")
          : Array(25).fill("C")
      );
      toast.success(message, { autoClose: 5000 });
    });

    socket.on("gameEnded", ({ message }) => {
      setQuizFinished(true);
      setGameStarted(false);
      toast.info(message || "Game ended due to player disconnection", {
        autoClose: 3000,
      });
    });

    socket.on("playerLeft", ({ userId, username }) => {
      if (userId !== user._id) {
        toast.info(`${username} left. Game ending...`, { autoClose: 3000 });
      }
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
      toast.error("Connection to server failed. Reconnecting...", {
        autoClose: 3000,
      });
    });

    socket.on("reconnect", () => {
      console.log("Reconnected to server");
      if (!gameStarted && !quizFinished) {
        socket.emit("joinRoom", {
          roomId,
          userId: user._id,
          username: user.username,
        });
      }
    });

    return () => {
      socket.off("gameStarted");
      socket.off("updatePlayers");
      socket.off("updateTurn");
      socket.off("cellClick");
      socket.off("updateOwnership");
      socket.off("questionFetched");
      socket.off("answerSubmitted");
      socket.off("gameOver");
      socket.off("gameEnded");
      socket.off("playerLeft");
      socket.off("connect_error");
      socket.off("reconnect");
    };
  }, [roomId, user, gameStarted, quizFinished]);

  const handleStartNewGame = () => {
    if (!quizFinished) {
      toast.info("Please wait for the current game to end!", {
        autoClose: 3000,
      });
      return;
    }
    setCellOwnership(Array(25).fill(null));
    setUsedCells([]);
    setPlayerScore(0);
    setComputerScore(0);
    setQuizFinished(false);
    setQuizData(null);
    setCurrentCell(null);
    setTimerStart(null);
    setTimerKey((prevKey) => prevKey + 1);
    setLoading(true);
    setGameStarted(false);
    socket.emit("restartGame", roomId);
    toast.success("New game started! Waiting for players...", {
      position: "top-right",
      autoClose: 3000,
    });
  };

  const handleApiClick = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(api);
      if (!response.ok) throw new Error("Failed to fetch question");
      const data = await response.json();
      const singleQuestion = data[0];
      const shuffledAnswers = shuffleArray([
        singleQuestion.correctAnswer,
        ...singleQuestion.incorrectAnswers,
      ]);
      setQuizData({ ...singleQuestion, shuffledAnswers });
      setSelectedAnswer(null);
      setIsAnswerCorrect(null);
      setIsAnswered(false);
      const cellColor = colorForCell(currentCell);
      const timerStart = cellColor === styles.redCell ? 30 : cellColor === styles.blueCell ? 45 : 60;
      setTimerStart(timerStart);
      setTimerActive(true);
      setTimerKey((prevKey) => prevKey + 1);
      socket.emit("questionFetched", {
        roomId,
        question: singleQuestion.question.text,
        options: shuffledAnswers,
        correctAnswer: singleQuestion.correctAnswer,
        timerStart,
      });
    } catch (err) {
      setError(err);
      toast.error("Failed to fetch question. Try again.", { autoClose: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const handleTimeout = () => {
    if (isAnswered || quizFinished || loading || currentTurn !== user._id)
      return;

    setIsAnswered(true);
    setIsAnswerCorrect(false);
    setTimerActive(false);

    const nextTurn = players.find((p) => p.userId !== currentTurn)?.userId;

    socket.emit("submitAnswer", {
      roomId,
      cellIndex: currentCell,
      isCorrect: false,
      playerId: user._id,
      nextTurn,
      selectedAnswer: null,
    });

    updateCellOwnership(
      currentCell,
      currentTurn === players[0].userId ? "C" : "P",
      false
    );

    if (usedCells.length + 1 >= 5) checkWinCondition();
  };

  const handleCellClick = (index) => {
    if (
      quizFinished ||
      usedCells.includes(index) ||
      loading ||
      currentTurn !== user._id
    ) {
      if (currentTurn !== user._id) {
        toast.info("Wait for your turn!", { autoClose: 2000 });
      } else if (usedCells.includes(index)) {
        toast.info("Cell already used!", { autoClose: 2000 });
      } else {
        toast.info("Wait for the game to start!", { autoClose: 2000 });
      }
      return;
    }
    setCurrentCell(index);
    const newUsedCells = [...usedCells, index];
    setUsedCells(newUsedCells);
    socket.emit("cellClick", { roomId, index });
    handleApiClick();
  };

  const handleAnswerClick = (answer) => {
    if (isAnswered || quizFinished || loading || currentTurn !== user._id)
      return;

    const correct = answer === quizData.correctAnswer;
    console.log("Selected Answer:", answer, "Is Correct:", correct);
    setSelectedAnswer(answer);
    setIsAnswered(true);
    setTimerActive(false);
    setIsAnswerCorrect(correct);

    setTimeout(() => {
      const nextTurn = players.find((p) => p.userId !== currentTurn)?.userId;

      socket.emit("submitAnswer", {
        roomId,
        cellIndex: currentCell,
        isCorrect: correct,
        playerId: user._id,
        nextTurn,
        selectedAnswer: answer,
      });

      updateCellOwnership(
        currentCell,
        correct
          ? currentTurn === players[0].userId
            ? "P"
            : "C"
          : currentTurn === players[0].userId
          ? "C"
          : "P",
        correct
      );

      if (usedCells.length + 1 >= 5) checkWinCondition();
    }, 3000);
  };

  const updateCellOwnership = (index, owner, isCorrect) => {
    const newOwnership = [...cellOwnership];
    newOwnership[index] = owner;
    setCellOwnership(newOwnership);
    setPlayerScore(scoreReader(newOwnership, "P"));
    setComputerScore(scoreReader(newOwnership, "C"));
    if (isCorrect) {
      const currentPlayer = players.find((p) => p.userId === currentTurn);
      currentPlayer.score += 1;
    } else {
      const opponent = players.find((p) => p.userId !== currentTurn);
      if (opponent) opponent.score += 1;
    }
    socket.emit("updateOwnership", { roomId, cellIndex: index, owner });
    socket.emit("updatePlayers", {
      players,
      currentTurn,
      cellOwnership: newOwnership,
    });
  };

  const checkWinCondition = () => {
    const winPatterns = [
      [0, 1, 2, 3, 4],
      [5, 6, 7, 8, 9],
      [10, 11, 12, 13, 14],
      [15, 16, 17, 18, 19],
      [20, 21, 22, 23, 24],
      [0, 5, 10, 15, 20],
      [1, 6, 11, 16, 21],
      [2, 7, 12, 17, 22],
      [3, 8, 13, 18, 23],
      [4, 9, 14, 19, 24],
      [0, 6, 12, 18, 24],
      [4, 8, 12, 16, 20],
    ];
    for (const pattern of winPatterns) {
      if (pattern.every((i) => cellOwnership[i] === "P")) {
        setQuizFinished(true);
        socket.emit("gameOver", { roomId, winner: players[0].userId });
        return;
      }
      if (pattern.every((i) => cellOwnership[i] === "C")) {
        setQuizFinished(true);
        socket.emit("gameOver", { roomId, winner: players[1].userId });
        return;
      }
    }
    if (usedCells.length === 25) {
      setQuizFinished(true);
      const winner =
        playerScore > computerScore ? players[0].userId : players[1].userId;
      socket.emit("gameOver", { roomId, winner });
    }
  };

  const colorForCell = useMemo(
    () => (index) => {
      const cellOwner = cellOwnership[index];
      if (cellOwner === "P") return styles.playerCell;
      if (cellOwner === "C") return styles.computerCell;
      const cellNumber = index + 1;
      if (cellNumber === 13) return styles.redCell;
      if ([1, 5, 7, 9, 17, 19, 21, 25].includes(cellNumber))
        return styles.blueCell;
      return styles.orangeCell;
    },
    [cellOwnership]
  );

  const currentPlayer = players.find((p) => p.userId === currentTurn);

  return (
    <GridContainer>
      <Header>
        <HeaderContent>
          <LogoSection>
            <LogoImage src={Logo} alt="QuizGrid Logo" />
          </LogoSection>
          <UserSection>
            <UserInfo>
              <UserAvatar>👤</UserAvatar>
              <UserDetails>
                <UserName>{user?.username}</UserName>
                <UserStatus>Online</UserStatus>
              </UserDetails>
            </UserInfo>
            <LogoutButton onClick={handleLogout}>
              <LogoutIcon>🚪</LogoutIcon>
              Logout
            </LogoutButton>
            <NewGameButton onClick={handleStartNewGame}>
              <ButtonIcon>🔄</ButtonIcon>
              New Game
            </NewGameButton>
          </UserSection>
        </HeaderContent>
      </Header>

      <MainContent>
        <Timer
          startTime={timerStart}
          isActive={timerActive}
          key={timerKey}
          onTimeout={handleTimeout}
        />
        {loading && (
          <LoaderContainer>
            <Loader />
            <p>Waiting for the second player to join...</p>
          </LoaderContainer>
        )}
        {error && (
          <p style={{ textAlign: "center", color: "red" }}>
            Error: {error?.message || "An unexpected error occurred"}
          </p>
        )}
        {!loading &&
          !error &&
          quizData &&
          currentCell !== null &&
          !quizFinished && (
            <QuestionContainer>
              <QuestionText>{quizData.question.text}</QuestionText>
              <OptionsList className={styles.optionsContainer}>
                {quizData.shuffledAnswers.map((answer, index) => (
                  <OptionItem
                    key={`${answer}-${index}`}
                    onClick={() => handleAnswerClick(answer)}
                    className={`${styles.optionBox} ${
                      isAnswered
                        ? answer === quizData.correctAnswer
                          ? styles.correctOption
                          : selectedAnswer === answer
                          ? styles.incorrectOption
                          : ""
                        : ""
                    } ${
                      isAnswered || currentTurn !== user._id
                        ? styles.disabledOption
                        : ""
                    }`}
                    style={{
                      pointerEvents:
                        isAnswered || currentTurn !== user._id ? "none" : "auto",
                    }}
                  >
                    {answer}
                  </OptionItem>
                ))}
              </OptionsList>
              {isAnswerCorrect === false && quizData && (
                <CorrectAnswerMsg className={styles.correctAnswerMsg}>
                  The correct answer is: {quizData.correctAnswer}
                </CorrectAnswerMsg>
              )}
            </QuestionContainer>
          )}
        {quizFinished && (
          <EndScreen className={styles.endScreen}>
            <h2>Game Over!</h2>
            <p>{players.map((p) => `${p.username}: ${p.score}`).join(", ")}</p>
          </EndScreen>
        )}
        {(!quizData || quizFinished) && !loading && !error && (
          <GridWrapper>
            <div className={styles.gridContainer}>
              {Array.from({ length: 25 }, (_, index) => (
                <div
                  className={`${styles.cell} ${colorForCell(index)}`}
                  key={index}
                  onClick={() => handleCellClick(index)}
                >
                  {cellOwnership[index] || index + 1}
                </div>
              ))}
            </div>
          </GridWrapper>
        )}
        <Footer>
          <PlayerName>{players[0]?.username || "Player 1"}</PlayerName>
          <ScoreDisplay>
            <Score>{playerScore}</Score>
            {currentPlayer?.userId === players[0]?.userId && <TurnLine />}
            <Score>{computerScore}</Score>
            {currentPlayer?.userId === players[1]?.userId && <TurnLine />}
          </ScoreDisplay>
          <PlayerName>{players[1]?.username || "Player 2"}</PlayerName>
        </Footer>
        <ToastContainer />
      </MainContent>
    </GridContainer>
  );
};

const GridContainer = styled.div`
  min-height: 100vh;
  background: #000000;
  color: #ffffff;
  font-family: 'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
`;

const Header = styled.header`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
  gap: 2rem;
`;

const HeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;

  @media (max-width: 768px) {
    padding: 1rem;
    flex-direction: column;
    gap: 1rem;
  }

  @media (max-width: 480px) {
    padding: 0.75rem;
    gap: 0.5rem;
  }
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const LogoImage = styled.img`
  height: 4rem;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3));
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.1);
  }

  @media (max-width: 480px) {
    height: 3rem;
  }
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;

  @media (max-width: 768px) {
    gap: 0.8rem;
    flex-direction: column;
    align-items: flex-end;
  }

  @media (max-width: 480px) {
    gap: 0.5rem;
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  padding: 0.5rem 0.75rem;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.2);

  @media (max-width: 480px) {
    padding: 0.4rem 0.6rem;
    gap: 0.4rem;
  }
`;

const UserAvatar = styled.div`
  font-size: 1.2rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));

  @media (max-width: 480px) {
    font-size: 1rem;
  }
`;

const UserDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
`;

const UserName = styled.span`
  font-weight: 600;
  font-size: 0.9rem;
  color: #ffffff;

  @media (max-width: 480px) {
    font-size: 0.8rem;
  }
`;

const UserStatus = styled.span`
  font-size: 0.7rem;
  color: #26a69a;
  font-weight: 500;

  @media (max-width: 480px) {
    font-size: 0.6rem;
  }
`;

const LogoutButton = styled.button`
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);

  &:hover {
    background: linear-gradient(135deg, #dc2626, #b91c1c);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.4);
  }

  @media (max-width: 768px) {
    padding: 0.5rem 1rem;
    font-size: 0.8rem;
  }

  @media (max-width: 480px) {
    padding: 0.4rem 0.8rem;
    font-size: 0.7rem;
  }
`;

const LogoutIcon = styled.span`
  font-size: 1rem;

  @media (max-width: 480px) {
    font-size: 0.9rem;
  }
`;

const NewGameButton = styled.button`
  background: linear-gradient(135deg, #26a69a, #00897b);
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  box-shadow: 0 4px 12px rgba(38, 166, 154, 0.3);

  &:hover {
    background: linear-gradient(135deg, #00897b, #00695c);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(38, 166, 154, 0.4);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(38, 166, 154, 0.4);
  }

  @media (max-width: 768px) {
    padding: 0.5rem 1rem;
    font-size: 0.8rem;
  }

  @media (max-width: 480px) {
    padding: 0.4rem 0.8rem;
    font-size: 0.7rem;
  }
`;

const ButtonIcon = styled.span`
  font-size: 1rem;

  @media (max-width: 480px) {
    font-size: 0.9rem;
  }
`;

const MainContent = styled.main`
  max-width: 1200px;
  margin: 0 auto;
  padding: 3rem 2rem;
  text-align: center;
  flex-grow: 1;

  @media (max-width: 768px) {
    padding: 2rem 1rem;
  }

  @media (max-width: 480px) {
    padding: 1.5rem 0.5rem;
  }
`;

const GridWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin: 2rem 0;
`;

const LoaderContainer = styled.div`
  text-align: center;
  color: #ffffff;
  padding: 2rem;
  background: rgba(74, 44, 110, 0.1);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);

  p {
    font-size: 1.1rem;
    margin-top: 1rem;
    color: #d4a017;

    @media (max-width: 480px) {
      font-size: 1rem;
    }
  }
`;

const Loader = styled.div`
  border: 8px solid rgba(255, 255, 255, 0.2);
  border-top: 8px solid #26a69a;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin: 0 auto;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @media (max-width: 480px) {
    width: 40px;
    height: 40px;
  }
`;

const QuestionContainer = styled.div`
  text-align: center;
  max-width: 700px;
  width: 90%;
  margin: 0 auto;
  background: rgba(74, 44, 110, 0.1);
  padding: 2rem;
  border-radius: 15px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  animation: fadeIn 0.5s ease-in;

  @media (max-width: 768px) {
    padding: 1.5rem;
  }

  @media (max-width: 480px) {
    padding: 1rem;
  }
`;

const QuestionText = styled.h2`
  font-size: 1.8rem;
  color: #ffffff;
  margin-bottom: 1.5rem;
  line-height: 1.4;
  font-weight: 700;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }

  @media (max-width: 480px) {
    font-size: 1.2rem;
    margin-bottom: 1rem;
  }
`;

const OptionsList = styled.ul`
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;

  @media (max-width: 480px) {
    gap: 0.75rem;
  }
`;

const OptionItem = styled.li`
  padding: 1rem;
  color: #080808;
  font-size: 1.1rem;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  background: linear-gradient(to bottom, #ffffff, #f0f0f0);
  border-radius: 10px;
  font-weight: 600;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(38, 166, 154, 0.4);
  }

  @media (max-width: 480px) {
    font-size: 1rem;
    padding: 0.75rem;
  }
`;

const CorrectAnswerMsg = styled.p`
  color: #d4a017;
  font-weight: 600;
  font-size: 1.2rem;
  margin-top: 1.5rem;
  animation: fadeIn 0.5s ease-in;

  @media (max-width: 480px) {
    font-size: 1rem;
    margin-top: 1rem;
  }
`;

const EndScreen = styled.div`
  text-align: center;
  color: #ffffff;
  background: rgba(74, 44, 110, 0.1);
  padding: 2.5rem;
  border-radius: 15px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  animation: fadeIn 0.5s ease-in;

  h2 {
    font-size: 2.5rem;
    margin-bottom: 1.5rem;
    font-weight: 800;
    color: #26a69a;

    @media (max-width: 768px) {
      font-size: 2rem;
    }

    @media (max-width: 480px) {
      font-size: 1.5rem;
    }
  }

  p {
    font-size: 1.3rem;
    color: #d4a017;

    @media (max-width: 768px) {
      font-size: 1.1rem;
    }

    @media (max-width: 480px) {
      font-size: 1rem;
    }
  }
`;

const Footer = styled.footer`
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 800px;
  margin: 2rem auto 1rem;
  padding: 1rem;
  background: rgba(74, 44, 110, 0.1);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
  }

  @media (max-width: 480px) {
    padding: 0.75rem;
  }
`;

const PlayerName = styled.div`
  font-size: 1.2rem;
  color: #ffffff;
  font-weight: 600;
  position: relative;

  @media (max-width: 480px) {
    font-size: 1rem;
  }
`;

const TurnLine = styled.div`
  position: absolute;
  bottom: -5px;
  left: 0;
  right: 0;
  height: 3px;
  width: 20%;
  background: #00e676;
`;

const ScoreDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
`;

const Score = styled.span`
  font-size: 1.5rem;
  color: #d4a017;
  font-weight: 700;

  @media (max-width: 480px) {
    font-size: 1.2rem;
  }
`;

export default Grid;