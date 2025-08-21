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

const Timer = ({ startTime, isActive, timerKey, onTimeout }) => {
  const [timeLeft, setTimeLeft] = useState(startTime);

  useEffect(() => {
    setTimeLeft(startTime || 0);
  }, [startTime, timerKey]);

  useEffect(() => {
    if (isActive && timeLeft === 0) {
      if (typeof onTimeout === 'function') {
        onTimeout();
      }
    }
  }, [timeLeft, isActive, onTimeout]);

  useEffect(() => {
    if (timeLeft === 0) return;

    let intervalId;
    if (isActive && timeLeft > 0) {
      intervalId = setInterval(() => {
        setTimeLeft((prevTime) => (prevTime > 0 ? prevTime - 1 : 0));
      }, 1000);
    }

    return () => clearInterval(intervalId);
  }, [timeLeft, isActive]);

  return (
    <TimerContainer>
      {timeLeft !== null ? `${timeLeft}s` : '0s'}
    </TimerContainer>
  );
};

export default Timer;
