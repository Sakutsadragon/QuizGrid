import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import styled from 'styled-components';

const TimerContainer = styled.div`
  text-align: center;
  padding: 1rem;
  background-color: #f0f0f0;
  border-radius: 0.4rem;
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
  width: 100px;
  margin: 1rem auto;
`;

const Timer = ({ startTime, isActive, timerKey }) => {
  const [timeLeft, setTimeLeft] = useState(startTime);

  // Reset timer when startTime or timerKey changes
  useEffect(() => {
    setTimeLeft(startTime || 0); // Default to 0 if startTime is null/undefined
  }, [startTime, timerKey]);

  // Timer countdown logic
  useEffect(() => {
    if (timeLeft === 0) {
      toast.warning("Time's up!", { position: 'top-right', autoClose: 3000 });
      return;
    }

    let intervalId;
    if (isActive && timeLeft > 0) {
      intervalId = setInterval(() => {
        setTimeLeft((prevTime) => (prevTime > 0 ? prevTime - 1 : 0));
      }, 1000);
    }

    return () => clearInterval(intervalId); // Cleanup on unmount or dependency change
  }, [timeLeft, isActive]);

  return (
    <TimerContainer>
      {timeLeft !== null ? `${timeLeft}s` : '0s'}
    </TimerContainer>
  );
};

export default Timer;