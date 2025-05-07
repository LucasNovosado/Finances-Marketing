// src/components/expenses/ExpenseSummaryStats.jsx

import React, { useState, useEffect } from 'react';
import { ChevronsUp, ChevronsDown, DollarSign, Calendar, ArrowRight } from 'lucide-react';
import './ExpenseSummaryStats.css';

const ExpenseSummaryStats = ({ expenses, filters }) => {
  const [stats, setStats] = useState({
    total: 0,
    average: 0,
    highest: { value: 0, item: null },
    lowest: { value: Infinity, item: null },
    count: 0,
    byMonth: [],     // Inicializado como array
    byCategory: [],  // Inicializado como array
    byBudget: []     // Inicializado como array
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

    // Calcular total, média, maior e menor
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



      <div className="top-categories">
        <h4 className="stats-subtitle">Principais Categorias</h4>
        <ul className="top-list">
          {Array.isArray(stats.byCategory) && stats.byCategory.slice(0, 5).map((category, index) => (
            <li key={index} className="top-item">
              <div className="top-item-name">{category.name}</div>
              <div className="top-item-value">{formatCurrency(category.value)}</div>
              <div className="top-item-count">{category.count} itens</div>
            </li>
          ))}
          {Array.isArray(stats.byCategory) && stats.byCategory.length > 5 && (
            <li className="more-items">
              <span>+ {stats.byCategory.length - 5} categorias</span>
              <ArrowRight size={14} />
            </li>
          )}
        </ul>
      </div>

      <div className="top-budgets">
        <h4 className="stats-subtitle">Principais Orçamentos</h4>
        <ul className="top-list">
          {Array.isArray(stats.byBudget) && stats.byBudget.slice(0, 5).map((budget, index) => (
            <li key={index} className="top-item">
              <div className="top-item-name">{budget.name}</div>
              <div className="top-item-value">{formatCurrency(budget.value)}</div>
              <div className="top-item-count">{budget.count} itens</div>
            </li>
          ))}
          {Array.isArray(stats.byBudget) && stats.byBudget.length > 5 && (
            <li className="more-items">
              <span>+ {stats.byBudget.length - 5} orçamentos</span>
              <ArrowRight size={14} />
            </li>
          )}
        </ul>
      </div>

      <div className="top-months">
        <h4 className="stats-subtitle">Despesas por Mês</h4>
        <ul className="top-list">
          {Array.isArray(stats.byMonth) && stats.byMonth.slice(0, 5).map((month, index) => (
            <li key={index} className="top-item">
              <div className="top-item-name">{month.name}</div>
              <div className="top-item-value">{formatCurrency(month.value)}</div>
              <div className="top-item-count">{month.count} itens</div>
            </li>
          ))}
          {Array.isArray(stats.byMonth) && stats.byMonth.length > 5 && (
            <li className="more-items">
              <span>+ {stats.byMonth.length - 5} meses</span>
              <ArrowRight size={14} />
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default ExpenseSummaryStats;