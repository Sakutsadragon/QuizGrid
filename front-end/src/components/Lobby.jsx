import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './grid.module.css';

const Lobby = ({ handleLogout }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('quizgrid-user'));

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Welcome, {user.username}!</h1>
      <div className={styles.buttonContainer}>
        <button onClick={handleLogout} className={`${styles.button} ${styles.logoutButton}`}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Lobby;