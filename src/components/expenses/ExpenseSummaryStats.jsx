// src/components/expenses/ExpenseSummaryStats.jsx - VERSÃO COM FUNCIONALIDADE DE EXPANDIR

import React, { useState, useEffect } from 'react';
import { ChevronsUp, ChevronsDown, DollarSign, Calendar, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import './ExpenseSummaryStats.css';

const ExpenseSummaryStats = ({ expenses, filters }) => {
  const [stats, setStats] = useState({
    total: 0,
    average: 0,
    highest: { value: 0, item: null },
    lowest: { value: Infinity, item: null },
    count: 0,
    byMonth: [],
    byCategory: [],
    byBudget: []
  });

  // Estados para controlar a expansão de cada seção
  const [expandedSections, setExpandedSections] = useState({
    categories: false,
    budgets: false,
    months: false
  });

  // Calcular estatísticas
  useEffect(() => {
    if (expenses.length === 0) {
      setStats({
        total: 0,
        average: 0,
        highest: { value: 0, item: null },
        lowest: { value: 0, item: null },
        count: 0,
        byMonth: [],
        byCategory: [],
        byBudget: []
      });
      return;
    }

    let total = 0;
    let highest = { value: 0, item: null };
    let lowest = { value: Infinity, item: null };
    const byMonthObj = {};
    const byCategoryObj = {};
    const byBudgetObj = {};

    expenses.forEach(expense => {
      const value = Number(expense.valorPago) || 0;
      total += value;

      // Maior valor
      if (value > highest.value) {
        highest = { value, item: expense };
      }

      // Menor valor (que não seja zero)
      if (value < lowest.value && value > 0) {
        lowest = { value, item: expense };
      }

      // Agrupar por mês
      const date = new Date(expense.dataDespesa || expense.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

      if (!byMonthObj[monthKey]) {
        byMonthObj[monthKey] = {
          name: monthName,
          value: 0,
          count: 0
        };
      }
      byMonthObj[monthKey].value += value;
      byMonthObj[monthKey].count += 1;

      // Agrupar por categoria
      const category = expense.categoria || 'Sem Categoria';
      if (!byCategoryObj[category]) {
        byCategoryObj[category] = {
          name: category,
          value: 0,
          count: 0
        };
      }
      byCategoryObj[category].value += value;
      byCategoryObj[category].count += 1;

      // Agrupar por orçamento
      const budget = expense.orcamento || 'Sem Orçamento';
      if (!byBudgetObj[budget]) {
        byBudgetObj[budget] = {
          name: budget,
          value: 0,
          count: 0
        };
      }
      byBudgetObj[budget].value += value;
      byBudgetObj[budget].count += 1;
    });

    // Converter objetos para arrays e ordenar
    const byMonth = Object.values(byMonthObj).sort((a, b) => b.value - a.value);
    const byCategory = Object.values(byCategoryObj).sort((a, b) => b.value - a.value);
    const byBudget = Object.values(byBudgetObj).sort((a, b) => b.value - a.value);

    // Se não houver despesas com valor maior que zero
    if (lowest.value === Infinity) {
      lowest = { value: 0, item: null };
    }

    setStats({
      total,
      average: total / expenses.length,
      highest,
      lowest,
      count: expenses.length,
      byMonth,
      byCategory,
      byBudget
    });
  }, [expenses]);

  // Função para alternar a expansão de uma seção
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Função para renderizar uma lista de itens com opção de expandir
  const renderExpandableList = (items, sectionKey, title, maxItems = 5) => {
    const isExpanded = expandedSections[sectionKey];
    const displayItems = isExpanded ? items : items.slice(0, maxItems);
    const hasMoreItems = items.length > maxItems;

    return (
      <div className={`top-${sectionKey}`}>
        <h4 className="stats-subtitle">{title}</h4>
        <ul className="top-list">
          {displayItems.map((item, index) => (
            <li key={index} className="top-item">
              <div className="top-item-name">{item.name}</div>
              <div className="top-item-value">{formatCurrency(item.value)}</div>
              <div className="top-item-count">{item.count} itens</div>
            </li>
          ))}
          
          {hasMoreItems && (
            <li className="more-items" onClick={() => toggleSection(sectionKey)}>
              <span>
                {isExpanded 
                  ? 'Mostrar menos' 
                  : `+ ${items.length - maxItems} ${sectionKey === 'categories' ? 'categorias' : sectionKey === 'budgets' ? 'orçamentos' : 'meses'}`
                }
              </span>
              {isExpanded ? (
                <ChevronUp size={14} />
              ) : (
                <ChevronDown size={14} />
              )}
            </li>
          )}
        </ul>
      </div>
    );
  };

  // Formatar valor monetário
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Formatar data
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  return (
    <div className="expense-summary-stats">
      <h3 className="stats-title">Resumo Estatístico</h3>

      {/* Renderizar listas expandíveis */}
      {renderExpandableList(stats.byCategory, 'categories', 'Principais Categorias')}
      {renderExpandableList(stats.byBudget, 'budgets', 'Principais Orçamentos')}
      {renderExpandableList(stats.byMonth, 'months', 'Despesas por Mês')}
    </div>
  );
};

export default ExpenseSummaryStats;