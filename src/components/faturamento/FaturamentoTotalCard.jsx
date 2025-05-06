// src/components/faturamento/FaturamentoTotalCard.jsx

import React from 'react';
import './FaturamentoTotalCard.css';

const FaturamentoTotalCard = ({ totalComSucata, totalSemSucata, formatCurrency }) => {
  // Calcula 0,25% do valor total
  const calcularPercentual = (valor) => {
    // Calcula 0,25% do valor
    const percentual = valor * 0.0025;
    
    // Formata o resultado como moeda
    return formatCurrency(percentual);
  };
  
  return (
    <div className="faturamento-total-card">
      <h3>Total do Faturamento</h3>
      
      <div className="totais-grid">
        <div className="total-item">
          <div className="total-label">Total COM Sucata:</div>
          <div className="total-value">{formatCurrency(totalComSucata)}</div>
          <div className="total-percentual">0,25%: {calcularPercentual(totalComSucata)}</div>
        </div>
        
        <div className="total-item">
          <div className="total-label">Total SEM Sucata:</div>
          <div className="total-value">{formatCurrency(totalSemSucata)}</div>
          <div className="total-percentual">0,25%: {calcularPercentual(totalSemSucata)}</div>
        </div>
      </div>
    </div>
  );
};

export default FaturamentoTotalCard;