// src/components/common/ErrorMessage.jsx
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import './CommonComponents.css';

const ErrorMessage = ({ message, onRetry }) => {
  return (
    <div className="error-message-container">
      <div className="error-icon">
        <AlertTriangle size={32} />
      </div>
      <h3 className="error-title">Ocorreu um erro</h3>
      <p className="error-text">{message}</p>
      {onRetry && (
        <button className="retry-button" onClick={onRetry}>
          Tentar novamente
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;