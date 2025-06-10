// src/components/expenses/ExpenseFilterPanel.jsx - VERSÃO COM FILTROS POR MÊS

import React, { useState } from 'react';
import { Calendar, Search, Filter, X } from 'lucide-react';
import './ExpenseFilterPanel.css';

const ExpenseFilterPanel = ({ filters, categories, budgets, onFilterChange, onClearFilters }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Lista de meses para os dropdowns
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
  
  // Anos disponíveis (últimos 5 anos + próximo ano)
  const anoAtual = new Date().getFullYear();
  const anos = Array.from({length: 6}, (_, i) => anoAtual - 4 + i);
  
  // Função para formatar valor em reais
  const formatCurrency = (value) => {
    if (!value) return '';
    
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(num);
  };
  
  // Manipuladores de eventos para cada tipo de filtro
  const handleMonthYearChange = (field, value) => {
    onFilterChange({ [field]: parseInt(value) });
  };
  
  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    onFilterChange({ [name]: value });
  };
  
  const handleAmountChange = (e) => {
    const { name, value } = e.target;
    onFilterChange({ [name]: value });
  };
  
  const handleSearchChange = (e) => {
    onFilterChange({ searchTerm: e.target.value });
  };
  
  // Função para obter o nome do mês
  const getMesNome = (mesNumero) => {
    const mes = meses.find(m => m.value === mesNumero);
    return mes ? mes.label : '';
  };
  
  return (
    <div className="filter-panel">
      <div className="filter-panel-header">
        <h3>
          <Filter size={18} />
          Filtros
        </h3>
        <div className="filter-panel-actions">
          <button 
            className="clear-filters-btn" 
            onClick={onClearFilters}
            title="Limpar todos os filtros"
          >
            <X size={18} />
            Limpar
          </button>
          <button 
            className="toggle-filters-btn"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Menos filtros' : 'Mais filtros'}
          </button>
        </div>
      </div>
      
      <div className="search-box">
        <Search size={18} className="search-icon" />
        <input 
          type="text" 
          placeholder="Pesquisar por empresa ou descrição..." 
          value={filters.searchTerm || ''}
          onChange={handleSearchChange}
        />
      </div>
      
      <div className="filter-group">
        <label className="filter-label">
          <Calendar size={16} className="filter-icon" />
          Período
        </label>
        
        {/* Filtros de Mês/Ano em formato de grade */}
        <div className="period-filters">
          <div className="period-row">
            <div className="period-filter">
              <label>De (Mês):</label>
              <select
                value={filters.startMonth || new Date().getMonth() + 1}
                onChange={(e) => handleMonthYearChange('startMonth', e.target.value)}
              >
                {meses.map((mes) => (
                  <option key={mes.value} value={mes.value}>
                    {mes.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="period-filter">
              <label>Ano:</label>
              <select
                value={filters.startYear || new Date().getFullYear()}
                onChange={(e) => handleMonthYearChange('startYear', e.target.value)}
              >
                {anos.map((ano) => (
                  <option key={ano} value={ano}>{ano}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="period-row">
            <div className="period-filter">
              <label>Até (Mês):</label>
              <select
                value={filters.endMonth || new Date().getMonth() + 1}
                onChange={(e) => handleMonthYearChange('endMonth', e.target.value)}
              >
                {meses.map((mes) => (
                  <option key={mes.value} value={mes.value}>
                    {mes.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="period-filter">
              <label>Ano:</label>
              <select
                value={filters.endYear || new Date().getFullYear()}
                onChange={(e) => handleMonthYearChange('endYear', e.target.value)}
              >
                {anos.map((ano) => (
                  <option key={ano} value={ano}>{ano}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
      
      <div className="filter-group">
        <label className="filter-label">Categoria</label>
        <select
          name="category"
          value={filters.category || ''}
          onChange={handleSelectChange}
        >
          <option value="">Todas as categorias</option>
          {categories.map((category, index) => (
            <option key={index} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>
      
      <div className="filter-group">
        <label className="filter-label">Orçamento</label>
        <select
          name="budget"
          value={filters.budget || ''}
          onChange={handleSelectChange}
        >
          <option value="">Todos os orçamentos</option>
          {budgets.map((budget, index) => (
            <option key={index} value={budget}>
              {budget}
            </option>
          ))}
        </select>
      </div>
      
      {isExpanded && (
        <div className="expanded-filters">
          <div className="filter-group">
            <label className="filter-label">Valor</label>
            <div className="range-filters">
              <div className="range-filter">
                <label>Mínimo</label>
                <input
                  type="number"
                  name="minAmount"
                  placeholder="R$ 0,00"
                  value={filters.minAmount || ''}
                  onChange={handleAmountChange}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="range-filter">
                <label>Máximo</label>
                <input
                  type="number"
                  name="maxAmount"
                  placeholder="R$ 9.999,99"
                  value={filters.maxAmount || ''}
                  onChange={handleAmountChange}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="applied-filters">
        <div className="applied-filters-title">Filtros aplicados:</div>
        <div className="filter-chips">
          {/* Chip do período */}
          {(filters.startMonth || filters.startYear || filters.endMonth || filters.endYear) && (
            <div className="filter-chip">
              <span>
                Período: {getMesNome(filters.startMonth || new Date().getMonth() + 1)}/{filters.startYear || new Date().getFullYear()} 
                {(filters.startMonth !== filters.endMonth || filters.startYear !== filters.endYear) && 
                  ` até ${getMesNome(filters.endMonth || new Date().getMonth() + 1)}/${filters.endYear || new Date().getFullYear()}`
                }
              </span>
              <button onClick={() => onFilterChange({ 
                startMonth: new Date().getMonth() + 1, 
                startYear: new Date().getFullYear(),
                endMonth: new Date().getMonth() + 1, 
                endYear: new Date().getFullYear()
              })}>
                <X size={14} />
              </button>
            </div>
          )}
          
          {filters.category && (
            <div className="filter-chip">
              <span>Categoria: {filters.category}</span>
              <button onClick={() => onFilterChange({ category: '' })}>
                <X size={14} />
              </button>
            </div>
          )}
          
          {filters.budget && (
            <div className="filter-chip">
              <span>Orçamento: {filters.budget}</span>
              <button onClick={() => onFilterChange({ budget: '' })}>
                <X size={14} />
              </button>
            </div>
          )}
          
          {filters.minAmount && (
            <div className="filter-chip">
              <span>Valor mín: {formatCurrency(filters.minAmount)}</span>
              <button onClick={() => onFilterChange({ minAmount: '' })}>
                <X size={14} />
              </button>
            </div>
          )}
          
          {filters.maxAmount && (
            <div className="filter-chip">
              <span>Valor máx: {formatCurrency(filters.maxAmount)}</span>
              <button onClick={() => onFilterChange({ maxAmount: '' })}>
                <X size={14} />
              </button>
            </div>
          )}
          
          {filters.searchTerm && (
            <div className="filter-chip">
              <span>Busca: {filters.searchTerm}</span>
              <button onClick={() => onFilterChange({ searchTerm: '' })}>
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpenseFilterPanel;