import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Logo from '../assets/logoo.png';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/ReactToastify.css';
import axios from 'axios';
import { loginRoute } from './APIRoutes';

function Login({ setIsLoggedIn }) {
  const navigate = useNavigate();
  const [values, setValues] = useState({
    username: '',
    password: '',
  });

  const toastOptions = {
    position: 'bottom-right',
    autoClose: 4000,
    pauseOnHover: true,
    draggable: true,
  };

  useEffect(() => {
    const user = localStorage.getItem('quizgrid-user');
    if (user) {
      navigate('/');
    }
  }, [navigate]);

  const handleSubmission = async (event) => {
    event.preventDefault();

    if (validateEntry()) {
      try {
        const { username, password } = values;
        const { data } = await axios.post(loginRoute, {
          username,
          password,
        });

        if (data.status === false) {
          toast.error(data.msg, toastOptions);
        } else {
          localStorage.setItem('quizgrid-user', JSON.stringify(data.user)); // Store user data
          setIsLoggedIn(true); // Update App.jsx state
          navigate('/');
        }
      } catch (error) {
        console.error('Login error:', error.response?.data || error.message);
        toast.error('Login failed. Please try again later.', toastOptions);
      }
    }
  };

  const validateEntry = () => {
    const { password, username } = values;
    if (password.length === 0 || username.length === 0) {
      toast.error('Username and Password are required', toastOptions);
      return false;
    } else if (password.length < 8) {
      toast.error('Password should contain at least 8 characters', toastOptions);
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
        <WelcomeText>Welcome back!</WelcomeText>
        <SubText>You can sign in to access your existing account with your username or email!</SubText>
        <DecorativeLines />
      </LeftPanel>
      <RightPanel>
        <FormContainer onSubmit={handleSubmission}>
          <Brand>
            <img src={Logo} alt="Logo" />
          </Brand>
          <Input
            type="text"
            placeholder="Username or Email"
            name="username"
            onChange={handleChange}
            value={values.username}
          />
          <Input
            type="password"
            placeholder="Password"
            name="password"
            onChange={handleChange}
            value={values.password}
          />
          <Options>
            <RememberMe type="checkbox" id="remember" />
            <Label htmlFor="remember">Remember me</Label>
            <ForgotPassword>Forgot password?</ForgotPassword>
          </Options>
          <LoginButton type="submit">Sign In</LoginButton>
          <RegisterLink>
            New here? <Link to="/register">Create an Account</Link>
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
  background: linear-gradient(135deg, #0F72EA, #4A90E2);
`;

const LeftPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  padding: 2rem;
  color: white;
`;

const WelcomeText = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 1rem;
`;

const SubText = styled.p`
  font-size: 1.2rem;
  max-width: 70%;
`;

const DecorativeLines = styled.div`
  position: absolute;
  top: 10%;
  left: 5%;
  width: 40%;
  height: 80%;
  background: url('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320"%3E%3Cpath fill-opacity="0.1" d="M0,64L48,80C96,96,192,128,288,128C384,128,480,96,576,85.3C672,75,768,85,864,80C960,75,1056,53,1152,53.3C1248,53,1344,75,1392,85.3L1440,96V320H1392C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320H0Z"%3E%3C/path%3E%3C/svg%3E');
  background-size: cover;
  opacity: 0.5;
  z-index: -1;
`;

const RightPanel = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: white;
  padding: 2rem;
`;

const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  max-width: 400px;
  padding: 2rem;
  background: white;
  border-radius: 1rem 0 0 1rem;
`;

const Brand = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
  img {
    height: 5rem;
  }
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 2px solid #E6EAF3;
  border-radius: 0.5rem;
  font-size: 1rem;
  &:focus {
    border-color: #0F72EA;
    outline: none;
  }
`;

const Options = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  color: #666;
`;

const RememberMe = styled.input`
  margin-right: 0.5rem;
`;

const Label = styled.label`
  cursor: pointer;
`;

const ForgotPassword = styled.span`
  color: #0F72EA;
  cursor: pointer;
`;

const LoginButton = styled.button`
  background-color: #0F72EA;
  color: white;
  padding: 0.75rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 1.1rem;
  cursor: pointer;
  &:hover {
    background-color: #0E65CC;
  }
`;

const RegisterLink = styled.span`
  text-align: center;
  color: #666;
  a {
    color: #0F72EA;
    text-decoration: none;
    font-weight: bold;
  }
`;

export default Login;