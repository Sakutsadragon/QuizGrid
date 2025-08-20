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
    <HomeContainer>
      {/* Custom Header */}
      <Header>
        <HeaderContent>
          <LogoSection>
            <LogoImage src={Logo} alt="QuizGrid Logo" />
            <LogoText>QuizGrid</LogoText>
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
          </UserSection>
        </HeaderContent>
      </Header>

      {/* Main Content */}
      <MainContent>
        <WelcomeSection>
          <WelcomeTitle>
            Welcome back, <HighlightText>{user?.username}</HighlightText>! 🎉
          </WelcomeTitle>
          <WelcomeSubtitle>
            Ready to challenge your friends in the ultimate quiz battle?
          </WelcomeSubtitle>
        </WelcomeSection>

        <GameOptionsSection>
          <OptionCard>
            <OptionIcon>🏠</OptionIcon>
            <OptionTitle>Create New Room</OptionTitle>
            <OptionDescription>
              Start a new game and invite friends to join your quiz adventure
            </OptionDescription>
            <CreateRoomButton onClick={handlePlayWithFriend}>
              <ButtonIcon>✨</ButtonIcon>
              Create Room
            </CreateRoomButton>
          </OptionCard>

          <OptionCard>
            <OptionIcon>🚪</OptionIcon>
            <OptionTitle>Join Existing Room</OptionTitle>
            <OptionDescription>
              Enter a room ID to join an ongoing game with friends
            </OptionDescription>
            <JoinForm>
              <RoomInput
                type="text"
                placeholder="Enter Room ID"
                value={roomLink}
                readOnly
              />
              <JoinRoomButton onClick={handleJoinRoom} disabled={!roomLink}>
                <ButtonIcon>🎯</ButtonIcon>
                Join Room
              </JoinRoomButton>
            </JoinForm>
          </OptionCard>
        </GameOptionsSection>

        <FeaturesSection>
          <FeaturesTitle>🎮 Game Features</FeaturesTitle>
          <FeaturesGrid>
            <FeatureItem>
              <FeatureIcon>⚡</FeatureIcon>
              <FeatureText>Real-time multiplayer</FeatureText>
            </FeatureItem>
            <FeatureItem>
              <FeatureIcon>🧠</FeatureIcon>
              <FeatureText>Trivia questions</FeatureText>
            </FeatureItem>
            <FeatureItem>
              <FeatureIcon>🏆</FeatureIcon>
              <FeatureText>Score tracking</FeatureText>
            </FeatureItem>
            <FeatureItem>
              <FeatureIcon>⏱️</FeatureIcon>
              <FeatureText>Timed challenges</FeatureText>
            </FeatureItem>
          </FeaturesGrid>
        </FeaturesSection>
      </MainContent>

      <ToastContainer />
    </HomeContainer>
  );
}

const HomeContainer = styled.div`
  min-height: 100vh;
  background: #000000; /* Changed to solid black */
  color: #ffffff;
  font-family: 'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
  overflow-x: hidden;
`;

const Header = styled.header`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
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
  height: 3rem;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3));
  transition: transform 0.3s ease;
  
  &:hover {
    transform: scale(1.1);
  }
  
  @media (max-width: 480px) {
    height: 2.5rem;
  }
`;

const LogoText = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, #10b981, #6366f1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
  
  @media (max-width: 480px) {
    font-size: 1.2rem;
  }
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  
  @media (max-width: 768px) {
    gap: 1rem;
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
  gap: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  padding: 0.75rem 1rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  
  @media (max-width: 480px) {
    padding: 0.5rem 0.75rem;
    gap: 0.5rem;
  }
`;

const UserAvatar = styled.div`
  font-size: 1.5rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  
  @media (max-width: 480px) {
    font-size: 1.2rem;
  }
`;

const UserDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const UserName = styled.span`
  font-weight: 600;
  font-size: 1rem;
  color: #ffffff;
  
  @media (max-width: 480px) {
    font-size: 0.9rem;
  }
`;

const UserStatus = styled.span`
  font-size: 0.8rem;
  color: #10b981;
  font-weight: 500;
  
  @media (max-width: 480px) {
    font-size: 0.7rem;
  }
`;

const LogoutButton = styled.button`
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
  
  &:hover {
    background: linear-gradient(135deg, #dc2626, #b91c1c);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.4);
  }
  
  @media (max-width: 768px) {
    padding: 0.6rem 1.2rem;
    font-size: 0.9rem;
  }
  
  @media (max-width: 480px) {
    padding: 0.5rem 1rem;
    font-size: 0.8rem;
  }
`;

const LogoutIcon = styled.span`
  font-size: 1.1rem;
  
  @media (max-width: 480px) {
    font-size: 1rem;
  }
`;

const MainContent = styled.main`
  max-width: 1200px;
  margin: 0 auto;
  padding: 3rem 2rem;
  
  @media (max-width: 768px) {
    padding: 2rem 1rem;
  }
  
  @media (max-width: 480px) {
    padding: 1.5rem 0.5rem;
  }
`;

const WelcomeSection = styled.section`
  text-align: center;
  margin-bottom: 4rem;
  
  @media (max-width: 480px) {
    margin-bottom: 2rem;
  }
`;

const WelcomeTitle = styled.h2`
  font-size: 3.5rem;
  font-weight: 800;
  margin-bottom: 1.5rem;
  line-height: 1.2;
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
  
  @media (max-width: 480px) {
    font-size: 2rem;
    margin-bottom: 1rem;
  }
`;

const HighlightText = styled.span`
  background: linear-gradient(135deg, #10b981, #6366f1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const WelcomeSubtitle = styled.p`
  font-size: 1.4rem;
  color: #b0b0b0;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
  
  @media (max-width: 768px) {
    font-size: 1.2rem;
  }
  
  @media (max-width: 480px) {
    font-size: 1rem;
    max-width: 90%;
  }
`;

const GameOptionsSection = styled.section`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); /* Adjusted for better responsiveness */
  gap: 2rem;
  margin-bottom: 4rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  @media (max-width: 480px) {
    gap: 1rem;
  }
`;

const OptionCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 2.5rem;
  text-align: center;
  backdrop-filter: blur(20px);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    border-color: rgba(16, 185, 129, 0.4);
  }
  
  @media (max-width: 768px) {
    padding: 2rem;
  }
  
  @media (max-width: 480px) {
    padding: 1.5rem;
  }
`;

const OptionIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1.5rem;
  filter: drop-shadow(0 4px 16px rgba(0, 0, 0, 0.3));
  
  @media (max-width: 480px) {
    font-size: 3.5rem;
    margin-bottom: 1rem;
  }
`;

const OptionTitle = styled.h3`
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: #ffffff;
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
  
  @media (max-width: 480px) {
    font-size: 1.2rem;
  }
`;

const OptionDescription = styled.p`
  font-size: 1.1rem;
  color: #b0b0b0;
  line-height: 1.6;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    font-size: 1rem;
  }
  
  @media (max-width: 480px) {
    font-size: 0.9rem;
    margin-bottom: 1.5rem;
  }
`;

const CreateRoomButton = styled.button`
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
  
  &:hover {
    background: linear-gradient(135deg, #059669, #047857);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.3);
  }
  
  @media (max-width: 480px) {
    padding: 0.9rem 1.5rem;
    font-size: 1rem;
  }
`;

const JoinForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  
  @media (max-width: 480px) {
    gap: 0.75rem;
  }
`;

const RoomInput = styled.input`
  padding: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  font-size: 1rem;
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
  transition: all 0.3s ease;
  
  &::placeholder {
    color: #888;
  }
  
  &:focus {
    outline: none;
    border-color: #6366f1;
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }
  
  @media (max-width: 480px) {
    padding: 0.75rem;
    font-size: 0.9rem;
  }
`;

const JoinRoomButton = styled.button`
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
  
  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #4f46e5, #3730a3);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.3);
  }
  
  @media (max-width: 480px) {
    padding: 0.9rem 1.5rem;
    font-size: 1rem;
  }
`;

const ButtonIcon = styled.span`
  font-size: 1.2rem;
  
  @media (max-width: 480px) {
    font-size: 1.1rem;
  }
`;

const FeaturesSection = styled.section`
  text-align: center;
  
  @media (max-width: 480px) {
    margin-top: 1.5rem;
  }
`;

const FeaturesTitle = styled.h3`
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 2rem;
  color: #ffffff;
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
  
  @media (max-width: 480px) {
    font-size: 1.2rem;
    margin-bottom: 1rem;
  }
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); /* Adjusted for better responsiveness */
  gap: 1.5rem;
  max-width: 800px;
  margin: 0 auto;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
`;

const FeatureItem = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(16, 185, 129, 0.3);
  }
  
  @media (max-width: 480px) {
    padding: 1rem;
  }
`;

const FeatureIcon = styled.div`
  font-size: 2.5rem;
  margin-bottom: 1rem;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3));
  
  @media (max-width: 480px) {
    font-size: 2rem;
    margin-bottom: 0.75rem;
  }
`;

const FeatureText = styled.p`
  font-size: 1rem;
  font-weight: 500;
  color: #b0b0b0;
  margin: 0;
  
  @media (max-width: 480px) {
    font-size: 0.9rem;
  }
`;

export default Home;