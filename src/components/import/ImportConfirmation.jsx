// src/components/import/ImportConfirmation.jsx

import React from 'react';
import './ImportConfirmation.css';

const ImportConfirmation = ({ 
  success, 
  importStats = {}, 
  onStartNew, 
  onBackToDashboard 
}) => {
  const { totalItems = 0, totalSaved = 0, errors = 0 } = importStats;
  
  // Função para exibir o nome do mês
  const getMesNome = (mesNumero) => {
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    return meses[mesNumero - 1] || '';
  };
  
  // Exibe as estatísticas da importação
  return (
    <div className="confirmation-container">
      <div className="confirmation-icon">✓</div>
      
      <h2 className="confirmation-title">Importação Concluída com Sucesso!</h2>
      
      <p className="confirmation-message">
        {success || 'Seus dados foram importados para o sistema com sucesso.'}
      </p>
      
      <div className="confirmation-stats">
        <h3 className="confirmation-stats-title">Resumo da Importação</h3>
        
        <div className="stats-row">
          <div className="stats-label">Total de registros:</div>
          <div className="stats-value">{totalItems}</div>
        </div>
        
        <div className="stats-row">
          <div className="stats-label">Registros importados:</div>
          <div className="stats-value">{totalSaved}</div>
        </div>
        
        {errors > 0 && (
          <div className="stats-row">
            <div className="stats-label">Erros encontrados:</div>
            <div className="stats-value">{errors}</div>
          </div>
        )}
      </div>
      
      <div className="confirmation-actions">
        <button 
          className="new-import-button"
          onClick={onStartNew}
        >
          Iniciar Nova Importação
        </button>
        
        <button 
          className="dashboard-button"
          onClick={onBackToDashboard}
        >
          Voltar ao Dashboard
        </button>
      </div>
    </div>
  );
};

export default ImportConfirmation;