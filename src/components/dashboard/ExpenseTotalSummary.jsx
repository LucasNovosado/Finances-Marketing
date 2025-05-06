// src/components/dashboard/ExpenseTotalSummary.jsx

import React from 'react';
import './ExpenseTotalSummary.css';

const ExpenseTotalSummary = ({ totalGeral, totalGeralFiltered, totalGeneralBudgets, formatCurrency }) => {
  // Renderiza o valor filtrado (apenas os orçamentos específicos)
  return (
    <div className="expense-total-summary">
      <div className="expense-total-card">
        <h3>Total Geral de Despesas Rede Única</h3>
        <div className="expense-total-value">{formatCurrency(totalGeralFiltered)}</div>
        <div className="expense-total-note">
          <p>
            Despesas Rede Única de Baterias: {totalGeneralBudgets.join(', ')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExpenseTotalSummary;