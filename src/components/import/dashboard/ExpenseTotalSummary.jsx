// src/components/dashboard/ExpenseTotalSummary.jsx

import React from 'react';
import './ExpenseTotalSummary.css';

const ExpenseTotalSummary = ({ totalGeral, formatCurrency }) => {
  return (
    <div className="expense-total-summary">
      <div className="expense-total-card">
        <h3>Total Geral de Despesas</h3>
        <div className="expense-total-value">{formatCurrency(totalGeral)}</div>
      </div>
    </div>
  );
};

export default ExpenseTotalSummary;