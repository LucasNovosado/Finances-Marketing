// src/components/dashboard/DashboardSummary.jsx

import React, { useState, useEffect } from 'react';
import ExpenseSummaryByBudget from './ExpenseSummaryByBudget';
import ExpenseTotalSummary from './ExpenseTotalSummary';
import expenseService from '../../services/expenseService';
import './DashboardSummary.css';

const DashboardSummary = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(null);
  const [filters, setFilters] = useState({
    mes: new Date().getMonth() + 1, // Mês atual
    ano: new Date().getFullYear() // Ano atual
  });

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
  
  // Lista de anos para o filtro (últimos 5 anos)
  const anoAtual = new Date().getFullYear();
  const anos = Array.from({length: 5}, (_, i) => anoAtual - i);

  // Carregar os dados quando o componente montar ou quando os filtros mudarem
  useEffect(() => {
    const fetchSummaryData = async () => {
      try {
        setLoading(true);
        
        // Busca o resumo de despesas com base nos filtros atuais
        const summaryData = await expenseService.getExpensesSummaryByBudget(filters);
        
        setSummary(summaryData);
        setError('');
      } catch (err) {
        console.error('Erro ao carregar resumo de despesas:', err);
        setError('Não foi possível carregar o resumo de despesas. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchSummaryData();
  }, [filters]);

  // Atualiza os filtros quando o usuário seleciona um novo mês ou ano
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: parseInt(value)
    }));
  };

  // Formata um valor monetário
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return <div className="dashboard-summary-loading">Carregando dados...</div>;
  }

  return (
    <div className="dashboard-summary">
      <div className="dashboard-summary-header">
        <h2>Resumo de Despesas</h2>
        <div className="dashboard-summary-filters">
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
      </div>
      
      {error ? (
        <div className="dashboard-summary-error">{error}</div>
      ) : (
        <div className="dashboard-summary-content">
          {/* Componente para o total geral de despesas */}
          <ExpenseTotalSummary 
            totalGeral={summary?.totalGeral || 0} 
            formatCurrency={formatCurrency} 
          />
          
          {/* Componente para os totais por orçamento */}
          <ExpenseSummaryByBudget 
            summaryData={summary?.byBudget || []} 
            formatCurrency={formatCurrency} 
          />
        </div>
      )}
    </div>
  );
};

export default DashboardSummary;