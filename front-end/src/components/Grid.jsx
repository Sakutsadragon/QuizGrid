import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import io from 'socket.io-client';
import styled from 'styled-components';
import Timer from './Timer';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styles from './grid.module.css';

const socket = io('http://10.10.134.41:8000', {
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
  let x = 0, y = 0;
  for (let i = 0; i < array.length; i++) {
    if (array[i] === 'P') x++;
    else if (array[i] === 'C') y++;
  }
  return ind === 'P' ? x : y;
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
  const user = JSON.parse(localStorage.getItem('quizgrid-user'));

  const api = 'https://the-trivia-api.com/v2/questions';

  useEffect(() => {
    if (!user || !user._id) {
      console.error('No user or userId found in localStorage');
      navigate('/login');
      return;
    }

    if (!gameStarted && !quizFinished) {
      socket.emit('joinRoom', { roomId, userId: user._id, username: user.username });
    }

    socket.on('gameStarted', ({ players: initialPlayers, currentTurn: initialTurn, cellOwnership: initialOwnership }) => {
      setLoading(false);
      setGameStarted(true);
      setPlayers(initialPlayers);
      setCurrentTurn(initialTurn);
      setCellOwnership(initialOwnership);
      toast.success('Game started with both players!', { autoClose: 3000 });
    });

    socket.on('updatePlayers', ({ players: updatedPlayers, currentTurn: updatedTurn, cellOwnership: updatedOwnership }) => {
      setPlayers(updatedPlayers);
      setCurrentTurn(updatedTurn);
      setCellOwnership(updatedOwnership);
      setPlayerScore(scoreReader(updatedOwnership, 'P'));
      setComputerScore(scoreReader(updatedOwnership, 'C'));
    });

    socket.on('updateTurn', ({ currentTurn: updatedTurn }) => {
      setCurrentTurn(updatedTurn);
      setQuizData(null); // Clear question when turn ends
      setSelectedAnswer(null);
      setIsAnswerCorrect(null);
      setIsAnswered(false);
      setTimerActive(false);
      setTimerStart(null);
    });

    socket.on('cellClick', ({ index, currentTurn: turn }) => {
      if (turn !== user._id) {
        setCurrentCell(index); // Show the selected cell for the other player
        handleApiClick(); // Fetch question for visibility
      }
    });

    socket.on('updateOwnership', ({ cellIndex, owner }) => {
      const updated = [...cellOwnership];
      updated[cellIndex] = owner;
      setCellOwnership(updated);
      setPlayerScore(scoreReader(updated, 'P'));
      setComputerScore(scoreReader(updated, 'C'));
    });

    socket.on('questionFetched', ({ question, options, currentTurn: turn, correctAnswer }) => {
      if (turn !== user._id) {
        setQuizData({ question: { text: question }, shuffledAnswers: options, correctAnswer }); // Show question but disable answering
      } else if (turn === user._id) {
        setQuizData({ question: { text: question }, shuffledAnswers: options, correctAnswer });
        setTimerActive(true);
      }
    });

    socket.on('gameOver', ({ winner, finalScores, message }) => {
      setQuizFinished(true);
      setGameStarted(false);
      setPlayers(finalScores);
      setCellOwnership(finalScores[0].userId === winner ? Array(25).fill('P') : Array(25).fill('C')); // Visual feedback
      toast.success(message, { autoClose: 5000 });
    });

    socket.on('gameEnded', ({ message }) => {
      setQuizFinished(true);
      setGameStarted(false);
      toast.info(message || 'Game ended due to player disconnection', { autoClose: 3000 });
    });

    socket.on('playerLeft', ({ userId, username }) => {
      if (userId !== user._id) {
        toast.info(`${username} left. Game ending...`, { autoClose: 3000 });
      }
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      toast.error('Connection to server failed. Reconnecting...', { autoClose: 3000 });
    });

    socket.on('reconnect', () => {
      console.log('Reconnected to server');
      if (!gameStarted && !quizFinished) {
        socket.emit('joinRoom', { roomId, userId: user._id, username: user.username });
      }
    });

    return () => {
      socket.off('gameStarted');
      socket.off('updatePlayers');
      socket.off('updateTurn');
      socket.off('cellClick');
      socket.off('updateOwnership');
      socket.off('questionFetched');
      socket.off('gameOver');
      socket.off('gameEnded');
      socket.off('playerLeft');
      socket.off('connect_error');
      socket.off('reconnect');
    };
  }, [roomId, user, gameStarted, quizFinished]);

  const handleStartNewGame = () => {
    if (!quizFinished) {
      toast.info('Please wait for the current game to end!', { autoClose: 3000 });
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
    socket.emit('restartGame', roomId);
    toast.success('New game started! Waiting for players...', { position: 'top-right', autoClose: 3000 });
  };

  const handleApiClick = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(api);
      if (!response.ok) throw new Error('Failed to fetch question');
      const data = await response.json();
      const singleQuestion = data[0];
      const shuffledAnswers = shuffleArray([singleQuestion.correctAnswer, ...singleQuestion.incorrectAnswers]);
      setQuizData({ ...singleQuestion, shuffledAnswers });
      setSelectedAnswer(null);
      setIsAnswerCorrect(null);
      setTimerActive(true);
      setIsAnswered(false);
      socket.emit('questionFetched', { roomId, question: singleQuestion.question.text, options: shuffledAnswers, correctAnswer: singleQuestion.correctAnswer });
    } catch (err) {
      setError(err);
      toast.error('Failed to fetch question. Try again.', { autoClose: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const handleCellClick = (index) => {
    if (quizFinished || usedCells.includes(index) || loading || currentTurn !== user._id) {
      if (currentTurn !== user._id) {
        toast.info('Wait for your turn!', { autoClose: 2000 });
      } else if (usedCells.includes(index)) {
        toast.info('Cell already used!', { autoClose: 2000 });
      } else {
        toast.info('Wait for the game to start!', { autoClose: 2000 });
      }
      return;
    }
    setCurrentCell(index);
    const newUsedCells = [...usedCells, index];
    setUsedCells(newUsedCells);
    const cellColor = colorForCell(index);
    if (cellColor === styles.redCell) setTimerStart(30);
    else if (cellColor === styles.blueCell) setTimerStart(45);
    else setTimerStart(60);
    setTimerKey((prevKey) => prevKey + 1);
    socket.emit('cellClick', { roomId, index });
    handleApiClick();
  };

  const handleAnswerClick = (answer) => {
    if (isAnswered || quizFinished || loading || currentTurn !== user._id) return;

    const correct = answer === quizData.correctAnswer;
    setSelectedAnswer(answer);
    setIsAnswered(true);
    setTimerActive(false);
    setIsAnswerCorrect(correct);

    // Show correct/incorrect result for 3 seconds before proceeding
    setTimeout(() => {
      const nextTurn = players.find(p => p.userId !== currentTurn)?.userId;

      socket.emit('submitAnswer', {
        roomId,
        cellIndex: currentCell,
        isCorrect: correct,
        playerId: user._id,
        nextTurn
      });

      updateCellOwnership(
        currentCell,
        correct ? (currentTurn === players[0].userId ? 'P' : 'C') : (currentTurn === players[0].userId ? 'C' : 'P'),
        correct
      );

      if (usedCells.length + 1 >= 5) checkWinCondition(); // Check win after a delay too
    }, 3000); // 3 second delay
  };

  const updateCellOwnership = (index, owner, isCorrect) => {
    const newOwnership = [...cellOwnership];
    newOwnership[index] = owner;
    setCellOwnership(newOwnership);
    setPlayerScore(scoreReader(newOwnership, 'P'));
    setComputerScore(scoreReader(newOwnership, 'C'));
    if (isCorrect) {
      const currentPlayer = players.find(p => p.userId === currentTurn);
      currentPlayer.score += 1;
    } else {
      const opponent = players.find(p => p.userId !== currentTurn);
      opponent.score += 1;
    }
    socket.emit('updateOwnership', { roomId, cellIndex: index, owner });
    socket.emit('updatePlayers', { players, currentTurn, cellOwnership: newOwnership });
  };

  const checkWinCondition = () => {
    const winPatterns = [
      [0, 1, 2, 3, 4], [5, 6, 7, 8, 9], [10, 11, 12, 13, 14],
      [15, 16, 17, 18, 19], [20, 21, 22, 23, 24],
      [0, 5, 10, 15, 20], [1, 6, 11, 16, 21], [2, 7, 12, 17, 22], [3, 8, 13, 18, 23], [4, 9, 14, 19, 24],
      [0, 6, 12, 18, 24], [4, 8, 12, 16, 20],
    ];
    for (const pattern of winPatterns) {
      if (pattern.every((i) => cellOwnership[i] === 'P')) {
        setQuizFinished(true);
        socket.emit('gameOver', { roomId, winner: players[0].userId });
        return;
      }
      if (pattern.every((i) => cellOwnership[i] === 'C')) {
        setQuizFinished(true);
        socket.emit('gameOver', { roomId, winner: players[1].userId });
        return;
      }
    }
    if (usedCells.length === 25) {
      setQuizFinished(true);
      const winner = playerScore > computerScore ? players[0].userId : players[1].userId;
      socket.emit('gameOver', { roomId, winner });
    }
  };

  const colorForCell = (index) => {
    const cellOwner = cellOwnership[index];
    if (cellOwner === 'P') return styles.playerCell;
    if (cellOwner === 'C') return styles.computerCell;
    const cellNumber = index + 1;
    if (cellNumber === 13) return styles.redCell;
    if ([1, 5, 7, 9, 17, 19, 21, 25].includes(cellNumber)) return styles.blueCell;
    return styles.orangeCell;
  };

  const currentPlayer = players.find(p => p.userId === currentTurn);

  return (
    <GridContainer>
      <div className={styles.buttonContainer}>
        <LogoutButton onClick={handleLogout} className={`${styles.button} ${styles.logoutButton}`}>
          Logout
        </LogoutButton>
        <NewGameButton onClick={handleStartNewGame} className={`${styles.button} ${styles.newGameButton}`}>
          New Game
        </NewGameButton>
      </div>
      <PlayerInfo>
        {players.map((player) => (
          <PlayerCard key={player.userId}>
            <PlayerName>{player.username}</PlayerName>
            <PlayerScore>Score: {player.score}</PlayerScore>
          </PlayerCard>
        ))}
        <TurnIndicator>
          Current Turn: {currentPlayer ? currentPlayer.username : 'Waiting...'}
        </TurnIndicator>
      </PlayerInfo>
      <Timer startTime={timerStart} isActive={timerActive} key={timerKey} />
      {loading && (
        <LoaderContainer>
          <Loader />
          <p>Waiting for the second player to join...</p>
        </LoaderContainer>
      )}
      {error && <p style={{ textAlign: 'center', color: 'red' }}>Error: {error.message}</p>}
      {!loading && !error && quizData && currentCell !== null && !quizFinished && (
        <QuestionContainer>
          <QuestionText>{quizData.question.text}</QuestionText>
          <OptionsList className={styles.optionsContainer}>
            {quizData.shuffledAnswers.map((answer, index) => (
              <OptionItem
                key={index}
                onClick={() => handleAnswerClick(answer)}
                className={`${styles.optionBox} ${
                  selectedAnswer && answer === quizData.correctAnswer
                    ? styles.correctOption
                    : selectedAnswer === answer
                    ? styles.incorrectOption
                    : ''
                } ${isAnswered || currentTurn !== user._id ? styles.disabledOption : ''}`}
                style={{ pointerEvents: (isAnswered || currentTurn !== user._id) ? 'none' : 'auto' }}
              >
                {answer}
              </OptionItem>
            ))}
          </OptionsList>
          {isAnswerCorrect === false && (
            <CorrectAnswerMsg className={styles.correctAnswerMsg}>
              The correct answer is: {quizData.correctAnswer}
            </CorrectAnswerMsg>
          )}
        </QuestionContainer>
      )}
      {quizFinished && (
        <EndScreen className={styles.endScreen}>
          <h2>Game Over!</h2>
          <p>{players.map(p => `${p.username}: ${p.score}`).join(', ')}</p>
        </EndScreen>
      )}
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
      <ToastContainer />
    </GridContainer>
  );
};

const GridContainer = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
  gap: 1rem;
  font-family: 'Arial', sans-serif;
`;

const PlayerInfo = styled.div`
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  width: 100%;
  padding: 0.75rem;
  background-color: #e0e0e0;
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const PlayerCard = styled.div`
  text-align: center;
  background: #fff;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const PlayerName = styled.h3`
  font-size: 1rem;
  color: #333;
  margin: 0;
`;

const PlayerScore = styled.p`
  font-size: 0.9rem;
  color: #666;
  margin: 0.25rem 0;
`;

const TurnIndicator = styled.div`
  font-size: 1rem;
  color: #0F72EA;
  font-weight: bold;
  margin-top: 0.5rem;
`;

const LogoutButton = styled.button`
  background-color: #ff4b5c;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  font-weight: bold;
  cursor: pointer;
  border-radius: 0.25rem;
  font-size: 0.9rem;
  text-transform: uppercase;
  &:hover {
    background-color: #ff2e47;
  }
`;

const NewGameButton = styled.button`
  background-color: #4CAF50;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  font-weight: bold;
  cursor: pointer;
  border-radius: 0.25rem;
  font-size: 0.9rem;
  text-transform: uppercase;
  &:hover {
    background-color: #45a049;
  }
`;

const LoaderContainer = styled.div`
  text-align: center;
  color: #333;
  p {
    font-size: 1rem;
    margin-top: 0.75rem;
  }
`;

const Loader = styled.div`
  border: 6px solid #f3f3f3;
  border-top: 6px solid #0F72EA;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const QuestionContainer = styled.div`
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
  background: #fff;
  padding: 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  animation: fadeIn 0.3s ease-in;
`;

const QuestionText = styled.h2`
  font-size: 1.25rem;
  color: #333;
  margin-bottom: 0.75rem;
`;

const OptionsList = styled.ul`
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const OptionItem = styled.li`
  padding: 0.5rem;
  background-color: #f0f0f0;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: background-color 0.2s;
  &:hover {
    background-color: #e0e0e0;
  }
`;

const CorrectAnswerMsg = styled.p`
  color: #27ae60;
  font-weight: bold;
  font-size: 0.9rem;
  margin-top: 0.75rem;
`;

const EndScreen = styled.div`
  text-align: center;
  color: #333;
  background: #fff;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  animation: fadeIn 0.3s ease-in;
  h2 {
    font-size: 1.75rem;
    margin-bottom: 0.5rem;
  }
  p {
    font-size: 1.25rem;
  }
`;

export default Grid;