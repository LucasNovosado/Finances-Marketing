// src/components/common/LoadingSpinner.jsx
import React from 'react';
import './CommonComponents.css';

const LoadingSpinner = ({ message = 'Carregando...' }) => {
  return (
    <div className="loading-spinner-container">
      <div className="loading-spinner"></div>
      <p className="loading-message">{message}</p>
    </div>
  );
};

export default LoadingSpinner;