// src/components/dashboard/ExpenseSummaryByBudget.jsx

import React, { useState } from 'react';
import './ExpenseSummaryByBudget.css';

const ExpenseSummaryByBudget = ({ summaryData, formatCurrency }) => {
  const [showAll, setShowAll] = useState(false);
  
  // Por padrão, mostra apenas os 5 principais orçamentos
  const displayData = showAll ? summaryData : summaryData.slice(0, 5);
  
  // Verifica se há mais itens para mostrar
  const hasMoreItems = summaryData.length > 5;
  
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
            <div key={index} className="budget-card">
              <div className="budget-name">{item.orcamento}</div>
              <div className="budget-stats">
                <div className="budget-value">{formatCurrency(item.total)}</div>
                <div className="budget-count">{item.count} {item.count === 1 ? 'despesa' : 'despesas'}</div>
              </div>
              <div className="budget-percentage">
                <div className="percentage-bar">
                  <div 
                    className="percentage-fill"
                    style={{ width: `${Math.min(item.percentual, 100)}%` }}
                  ></div>
                </div>
                <div className="percentage-value">{item.percentual.toFixed(1)}%</div>
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