// src/components/dashboard/ExpenseSummaryByBudget.jsx

import React, { useState } from 'react';
import './ExpenseSummaryByBudget.css';

const ExpenseSummaryByBudget = ({ summaryData, formatCurrency }) => {
  const [showAll, setShowAll] = useState(false);
  
  // Por padrão, mostra apenas os 5 principais orçamentos
  const displayData = showAll ? summaryData : summaryData.slice(0, 5);
  
  // Verifica se há mais itens para mostrar
  const hasMoreItems = summaryData.length > 5;

  // Cores específicas para orçamentos especiais
  const getCardStyle = (item) => {
    if (item.color) {
      return {
        background: `linear-gradient(135deg, ${item.color}22, ${item.color}44)`,
        borderLeft: `4px solid ${item.color}`,
      };
    }
    return {};
  };
  
  // Cor para a barra de percentual
  const getBarStyle = (item) => {
    if (item.color) {
      return {
        background: `linear-gradient(90deg, ${item.color}, ${item.color}aa)`,
      };
    }
    return {};
  };
  
  return (
    <div className="expense-summary-by-budget">
      <h3>Total por Orçamento</h3>
      
      {displayData.length === 0 ? (
        <div className="no-data-message">
          Nenhuma despesa encontrada para o período selecionado.
        </div>
      ) : (
        <div className="budget-cards">
          {displayData.map((item, index) => (
            <div 
              key={index} 
              className="budget-card"
              style={getCardStyle(item)}
            >
              <div className="budget-name">{item.orcamento}</div>
              <div className="budget-stats">
                <div className="budget-value">{formatCurrency(item.total)}</div>
                <div className="budget-count">{item.count} {item.count === 1 ? 'despesa' : 'despesas'}</div>
              </div>
              <div className="budget-percentage">
                
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Botão para mostrar mais/menos itens */}
      {hasMoreItems && (
        <button 
          className="toggle-display-btn"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? 'Mostrar menos' : `Mostrar todos (${summaryData.length})`}
        </button>
      )}
    </div>
  );
};

export default ExpenseSummaryByBudget;