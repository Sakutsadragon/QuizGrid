import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Logo from '../assets/logoo.png';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/ReactToastify.css';

function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [roomLink, setRoomLink] = useState('');

  const toastOptions = {
    position: 'bottom-right',
    autoClose: 4000,
    pauseOnHover: true,
    draggable: true,
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('quizgrid-user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handlePlayWithFriend = () => {
    const newRoomId = Math.random().toString(36).substring(2, 15);
    const link = `${window.location.origin}/room/${newRoomId}`;
    setRoomLink(link);
    localStorage.setItem('roomId', newRoomId);
    toast.success('Share this link with your friend to start the game!', { autoClose: 5000 });
  };

  const handleLogout = () => {
    localStorage.removeItem('quizgrid-user');
    navigate('/login');
  };

  const handleJoinRoom = () => {
    if (roomLink && user) {
      window.location.href = roomLink;
    } else {
      toast.error('Please generate a room link or log in first!', toastOptions);
    }
  };

  return (
    <FormFiller>
      <div className="brand">
        <img src={Logo} alt="Logo" />
      </div>
      {user && (
        <WelcomeMessage>
          <h1>Welcome, {user.username}!</h1>
          <p>Email: {user.email}</p>
        </WelcomeMessage>
      )}
      <PlayButton onClick={handlePlayWithFriend} className="play-with-friend">
        Play with Friend
      </PlayButton>
      {roomLink && (
        <LinkContainer>
          <p>Share this link with your friend to join:</p>
          <input type="text" value={roomLink} readOnly style={{ width: '300px' }} />
          <JoinButton onClick={handleJoinRoom}>Join Room</JoinButton>
        </LinkContainer>
      )}
      <LogoutButton onClick={handleLogout}>Logout</LogoutButton>
      <ToastContainer />
    </FormFiller>
  );
}

const FormFiller = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2rem;
  align-items: center;
  background-color: white;
  .brand {
    display: flex;
    align-items: center;
    gap: 1rem;
    justify-content: center;
    img {
      height: 5rem;
      transform: scale(2.1);
      padding-top: 0.35rem;
    }
  }
`;

const WelcomeMessage = styled.div`
  text-align: center;
  color: #333;
  h1 {
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }
  p {
    font-size: 1rem;
    color: #666;
  }
`;

const PlayButton = styled.button`
  background-color: #4CAF50;
  color: white;
  padding: 1rem 2rem;
  border: none;
  font-weight: bold;
  cursor: pointer;
  border-radius: 0.4rem;
  font-size: 1rem;
  text-transform: uppercase;
  &:hover {
    background-color: #45a049;
  }
`;

const LinkContainer = styled.div`
  text-align: center;
  p {
    font-size: 1rem;
    color: #333;
    margin-bottom: 0.5rem;
  }
  input {
    padding: 0.5rem;
    border: 0.1rem solid #0F72EA;
    border-radius: 0.4rem;
    font-size: 1rem;
    text-align: center;
    margin-bottom: 1rem;
  }
`;

const JoinButton = styled.button`
  background-color: #0F72EA;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  font-weight: bold;
  cursor: pointer;
  border-radius: 0.4rem;
  font-size: 1rem;
  text-transform: uppercase;
  &:hover {
    background-color: #0E65CC;
  }
`;

const LogoutButton = styled.button`
  background-color: #ff4b5c;
  color: white;
  padding: 1rem 2rem;
  border: none;
  font-weight: bold;
  cursor: pointer;
  border-radius: 0.4rem;
  font-size: 1rem;
  text-transform: uppercase;
  &:hover {
    background-color: #ff2e47;
  }
`;

export default Home;