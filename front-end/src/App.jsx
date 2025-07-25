import React, { useState, useEffect } from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Lobby from './components/Lobby';
import Grid from './components/Grid';
import Login from './components/Login';
import Register from './components/Register';
import Home from './components/Home';


const isAuthenticated = () => {
  return localStorage.getItem('quizgrid-user') !== null;
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(null);

  useEffect(() => {
    setIsLoggedIn(isAuthenticated());
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('quizgrid-user');
    setIsLoggedIn(false);
  };

  if (isLoggedIn === null) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path='/' element={isLoggedIn ? <Lobby handleLogout={handleLogout} /> : <Navigate to='/login' />} />
        <Route path='/home' element={<Home/>}/>
        <Route path='/room/:roomId' element={isLoggedIn ? <Grid handleLogout={handleLogout} /> : <Navigate to='/login' />} />
        <Route path='/login' element={<Login setIsLoggedIn={setIsLoggedIn} />} />
        <Route path='/register' element={<Register />} />
      </Routes>
    </Router>
  );
}

export default App;