// src/pages/FaturamentoPage.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import FaturamentoForm from '../components/faturamento/FaturamentoForm';
import './FaturamentoPage.css';

const FaturamentoPage = () => {
  const [user, setUser] = useState(authService.getCurrentUser());
  const [success, setSuccess] = useState('');
  const [filters, setFilters] = useState({
    mes: new Date().getMonth() + 1, // Mês atual
    ano: new Date().getFullYear() // Ano atual
  });
  
  const navigate = useNavigate();
  
  // Lista de meses para o filtro
  const meses = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' }
  ];
  
  // Lista de anos para o filtro (últimos 5 anos + próximo ano)
  const anoAtual = new Date().getFullYear();
  const anos = Array.from({length: 6}, (_, i) => anoAtual - 4 + i);
  
  // Navega de volta para o dashboard
  const handleNavigateBack = () => {
    navigate('/dashboard');
  };
  
  // Atualiza os filtros quando o usuário seleciona um novo mês ou ano
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: parseInt(value)
    }));
  };
  
  // Callback quando o faturamento é salvo com sucesso
  const handleSaveSuccess = (data) => {
    setSuccess(`Faturamento de ${meses.find(m => m.value === data.mes)?.label} de ${data.ano} salvo com sucesso!`);
    
    // Esconde a mensagem após 3 segundos
    setTimeout(() => {
      setSuccess('');
    }, 3000);
  };
  
  if (!user) {
    // Redireciona para o login se não estiver autenticado
    navigate('/');
    return null;
  }
  
  return (
    <div className="faturamento-page-container">
      <header className="faturamento-page-header">
        <h1>Gerenciamento de Faturamento</h1>
        <div className="header-actions">
          <button 
            className="back-button" 
            onClick={handleNavigateBack}
          >
            ← Voltar ao Dashboard
          </button>
        </div>
      </header>
      
      <div className="faturamento-page-content">
        <div className="faturamento-page-card">
          <h2>Preencher Faturamento Mensal</h2>
          <p>
            Informe o faturamento de cada supervisor, com e sem sucata, para o período selecionado.
          </p>
          
          {success && <div className="success-message">{success}</div>}
          
          <div className="filter-controls">
            <div className="filter-group">
              <label htmlFor="mes">Mês:</label>
              <select 
                id="mes" 
                name="mes" 
                value={filters.mes}
                onChange={handleFilterChange}
              >
                {meses.map(mes => (
                  <option key={mes.value} value={mes.value}>
                    {mes.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label htmlFor="ano">Ano:</label>
              <select 
                id="ano" 
                name="ano" 
                value={filters.ano}
                onChange={handleFilterChange}
              >
                {anos.map(ano => (
                  <option key={ano} value={ano}>{ano}</option>
                ))}
              </select>
            </div>
          </div>
          
          <FaturamentoForm 
            mes={filters.mes}
            ano={filters.ano}
            onSave={handleSaveSuccess}
          />
        </div>
      </div>
    </div>
  );
};

export default FaturamentoPage;