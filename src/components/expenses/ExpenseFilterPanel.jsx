// src/components/expenses/ExpenseFilterPanel.jsx

import React, { useState } from 'react';
import { Calendar, Search, Filter, X } from 'lucide-react';
import './ExpenseFilterPanel.css';

const ExpenseFilterPanel = ({ filters, categories, budgets, onFilterChange, onClearFilters }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Formatar data para input
  const formatDateForInput = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
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
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    onFilterChange({ [name]: new Date(value) });
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
          value={filters.searchTerm}
          onChange={handleSearchChange}
        />
      </div>
      
      <div className="filter-group">
        <label className="filter-label">
          <Calendar size={16} className="filter-icon" />
          Período
        </label>
        <div className="date-filters">
          <div className="date-filter">
            <label>De</label>
            <input 
              type="date" 
              name="startDate"
              value={formatDateForInput(filters.startDate)}
              onChange={handleDateChange}
            />
          </div>
          <div className="date-filter">
            <label>Até</label>
            <input 
              type="date" 
              name="endDate"
              value={formatDateForInput(filters.endDate)}
              onChange={handleDateChange}
            />
          </div>
        </div>
      </div>
      
      <div className="filter-group">
        <label className="filter-label">Categoria</label>
        <select
          name="category"
          value={filters.category}
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
          value={filters.budget}
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
                  value={filters.minAmount}
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
                  value={filters.maxAmount}
                  onChange={handleAmountChange}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>
          
          {/* Espaço para filtros adicionais no futuro */}
        </div>
      )}
      
      <div className="applied-filters">
        <div className="applied-filters-title">Filtros aplicados:</div>
        <div className="filter-chips">
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