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

const RegisterButton = styled.button`
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

export default Register;