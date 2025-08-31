import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Logo from '../assets/logoo.png';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/ReactToastify.css';
import axios from 'axios';
import { registerRoute } from './APIRoutes';

function Register() {
  const navigate = useNavigate();
  const [values, setValues] = useState({
    username: '',
    email: '',
    password: '',
    confirmpassword: '',
  });

  const toastOptions = {
    position: 'bottom-right',
    autoClose: 4000,
    pauseOnHover: true,
    draggable: true,
  };

  useEffect(() => {
    if (localStorage.getItem('quizgrid-user')) navigate('/');
  }, [navigate]);

  const handleSubmission = async (event) => {
    event.preventDefault();
    if (validateEntry()) {
      const { username, email, password } = values;
      try {
        const { data } = await axios.post(registerRoute, {
          username,
          email,
          password,
        });
        if (data.status === false) {
          toast.error(data.msg, toastOptions);
        } else {
          localStorage.setItem('quizgrid-user', JSON.stringify(data.user)); // Store user data
          navigate('/');
        }
      } catch (error) {
        console.error('Registration error:', error.response?.data || error.message);
        toast.error('Registration failed. Please try again later.', toastOptions);
      }
    }
  };

  const validateEntry = () => {
    const { password, confirmpassword, username, email } = values;
    if (password !== confirmpassword) {
      toast.error('Password and Confirm Password are not the same', toastOptions);
      return false;
    } else if (username.length < 4) {
      toast.error('Username should contain at least 4 characters', toastOptions);
      return false;
    } else if (password.length < 8) {
      toast.error('Password should contain at least 8 characters', toastOptions);
      return false;
    } else if (!email.includes('@') || !email.includes('.com')) {
      toast.error('Enter a valid email format', toastOptions);
      return false;
    }
    return true;
  };

  const handleChange = (event) => {
    setValues({ ...values, [event.target.name]: event.target.value });
  };

  return (
    <Container>
      <LeftPanel>
        <WelcomeText>Create your account!</WelcomeText>
        <SubText>Sign up to start your quiz journey with your username, email, and password!</SubText>
        <DecorativeLines />
      </LeftPanel>
      <RightPanel>
        <FormContainer onSubmit={handleSubmission}>
          <Brand>
            <img src={Logo} alt="Logo" />
          </Brand>
          <Input type="text" placeholder="Username" name="username" onChange={handleChange} value={values.username} />
          <Input type="email" placeholder="Email" name="email" onChange={handleChange} value={values.email} />
          <Input type="password" placeholder="Password" name="password" onChange={handleChange} value={values.password} />
          <Input
            type="password"
            placeholder="Confirm Password"
            name="confirmpassword"
            onChange={handleChange}
            value={values.confirmpassword}
          />
          <RegisterButton type="submit">Sign Up</RegisterButton>
          <RegisterLink>
            Already have an account? <Link to="/login">Login</Link>
          </RegisterLink>
        </FormContainer>
      </RightPanel>
      <ToastContainer />
    </Container>
  );
}

const Container = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;
  background: linear-gradient(135deg, #0a0a0a, #1a1a1a);
  font-family: 'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const LeftPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  padding: 3rem;
  color: white;
  position: relative;
  
  @media (max-width: 768px) {
    align-items: center;
    text-align: center;
    padding: 2rem;
  }
`;

const WelcomeText = styled.h1`
  font-size: 3.5rem;
  font-weight: 800;
  margin-bottom: 1.5rem;
  background: linear-gradient(135deg, #ffffff, #e0e0e0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.1;
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
  
  @media (max-width: 480px) {
    font-size: 2rem;
  }
`;

const SubText = styled.p`
  font-size: 1.4rem;
  max-width: 80%;
  line-height: 1.6;
  color: #b0b0b0;
  font-weight: 400;
  
  @media (max-width: 768px) {
    max-width: 100%;
    font-size: 1.2rem;
  }
  
  @media (max-width: 480px) {
    font-size: 1rem;
  }
`;

const DecorativeLines = styled.div`
  position: absolute;
  top: 10%;
  left: 5%;
  width: 40%;
  height: 80%;
  background: url('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320"%3E%3Cpath fill-opacity="0.1" d="M0,64L48,80C96,96,192,128,288,128C384,128,480,96,576,85.3C672,75,768,85,864,80C960,75,1056,53,1152,53.3C1248,53,1344,75,1392,85.3L1440,96V320H1392C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320H0Z"%3E%3C/path%3E%3C/svg%3E');
  background-size: cover;
  opacity: 0.3;
  z-index: -1;
`;

const RightPanel = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #1e1e1e, #2d2d2d);
  padding: 2rem;
  
  @media (max-width: 768px) {
    padding: 2rem 1rem;
    min-height: 60vh;
  }
  
  @media (max-width: 480px) {
    padding: 1.5rem 1rem;
  }
`;

const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.8rem;
  width: 100%;
  max-width: 420px;
  padding: 3rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
  
  @media (max-width: 768px) {
    max-width: 450px;
    padding: 2.5rem;
  }
  
  @media (max-width: 480px) {
    padding: 2rem;
  }
`;

const Brand = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
  img {
    height: 5rem;
    transition: transform 0.3s ease;
  }
  
  &:hover img {
    transform: scale(1.05);
  }
  
  @media (max-width: 480px) {
    img {
      height: 4rem;
    }
  }
`;

const Input = styled.input`
  padding: 1.2rem;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  font-size: 1rem;
  font-family: 'Inter', sans-serif;
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
  transition: all 0.3s ease;
  
  &::placeholder {
    color: #888;
    font-weight: 400;
  }
  
  &:focus {
    border-color: #10b981;
    outline: none;
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
    transform: translateY(-2px);
  }
  
  &:hover {
    border-color: rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.06);
  }
`;

const RegisterButton = styled.button`
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  padding: 1.2rem;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
  
  &:hover {
    background: linear-gradient(135deg, #059669, #047857);
    transform: translateY(-3px);
    box-shadow: 0 12px 35px rgba(16, 185, 129, 0.4);
  }
  
  &:active {
    transform: translateY(-1px);
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.3);
  }
`;

const RegisterLink = styled.span`
  text-align: center;
  color: #b0b0b0;
  font-size: 0.95rem;
  font-weight: 500;
  
  a {
    color: #10b981;
    text-decoration: none;
    font-weight: 600;
    transition: color 0.3s ease;
    
    &:hover {
      color: #059669;
      text-decoration: underline;
    }
  }
`;

export default Register;