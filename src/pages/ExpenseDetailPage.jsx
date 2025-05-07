// src/pages/ExpenseDetailPage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ExpenseFilterPanel from '../components/expenses/ExpenseFilterPanel';
import ExpenseDetailTable from '../components/expenses/ExpenseDetailTable';
import ExpenseChartPanel from '../components/expenses/ExpenseChartPanel';
import ExpenseSummaryStats from '../components/expenses/ExpenseSummaryStats';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import expenseService from '../services/expenseService';
import './ExpenseDetailPage.css';

const ExpenseDetailPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date(),
    category: '',
    budget: '',
    minAmount: '',
    maxAmount: '',
    searchTerm: ''
  });
  const [activeView, setActiveView] = useState('table'); // 'table', 'chart'

  // Carregar dados iniciais
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        // Carrega despesas, categorias e orçamentos em paralelo
        const [expensesData, categoriesData, budgetsData] = await Promise.all([
          expenseService.getAllExpenses({}),
          expenseService.getAvailableCategories(),
          expenseService.getAvailableBudgets()
        ]);
        
        setExpenses(expensesData);
        setFilteredExpenses(expensesData);
        setCategories(categoriesData);
        setBudgets(budgetsData);
        setError('');
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        setError('Não foi possível carregar os dados. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Aplicar filtros quando mudarem
  useEffect(() => {
    if (expenses.length === 0) return;
    
    const applyFilters = () => {
      const result = expenses.filter(expense => {
        // Filtro de data
        const expenseDate = new Date(expense.dataDespesa || expense.createdAt);
        if (expenseDate < filters.startDate || expenseDate > filters.endDate) {
          return false;
        }
        
        // Filtro de categoria
        if (filters.category && expense.categoria !== filters.category) {
          return false;
        }
        
        // Filtro de orçamento
        if (filters.budget && expense.orcamento !== filters.budget) {
          return false;
        }
        
        // Filtro de valor mínimo
        if (filters.minAmount && expense.valorPago < parseFloat(filters.minAmount)) {
          return false;
        }
        
        // Filtro de valor máximo
        if (filters.maxAmount && expense.valorPago > parseFloat(filters.maxAmount)) {
          return false;
        }
        
        // Filtro de busca textual (empresa, observação)
        if (filters.searchTerm) {
          const searchTermLower = filters.searchTerm.toLowerCase();
          const empresa = (expense.empresa || '').toLowerCase();
          const observacao = (expense.observacao || '').toLowerCase();
          
          if (!empresa.includes(searchTermLower) && !observacao.includes(searchTermLower)) {
            return false;
          }
        }
        
        return true;
      });
      
      setFilteredExpenses(result);
    };
    
    applyFilters();
  }, [expenses, filters]);

  // Atualiza filtros
  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  };

  // Limpa todos os filtros
  const handleClearFilters = () => {
    setFilters({
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      endDate: new Date(),
      category: '',
      budget: '',
      minAmount: '',
      maxAmount: '',
      searchTerm: ''
    });
  };

  const handleExport = (format) => {
    // Implementar exportação para CSV/Excel
    console.log(`Exportando para ${format}...`);
    // expenseService.exportData(filteredExpenses, format);
  };

  if (loading) {
    return <LoadingSpinner message="Carregando dados de despesas..." />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="expense-detail-page">
      <header className="page-header">
        <h1>Detalhamento de Despesas</h1>
        <div className="page-actions">
          <button className="back-button" onClick={() => navigate('/dashboard')}>
            Voltar ao Dashboard
          </button>
          <div className="view-toggle">
            <button 
              className={`view-button ${activeView === 'table' ? 'active' : ''}`}
              onClick={() => setActiveView('table')}
            >
              Tabela
            </button>
            <button 
              className={`view-button ${activeView === 'chart' ? 'active' : ''}`}
              onClick={() => setActiveView('chart')}
            >
              Gráficos
            </button>
          </div>
        </div>
      </header>

      <div className="expense-main-content">
        <aside className="expense-sidebar">
          <ExpenseFilterPanel
            filters={filters}
            categories={categories}
            budgets={budgets}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
          
          <ExpenseSummaryStats 
            expenses={filteredExpenses}
            filters={filters}
          />
        </aside>

        <main className="expense-content">
          {activeView === 'table' ? (
            <ExpenseDetailTable 
              expenses={filteredExpenses} 
              onExport={handleExport}
            />
          ) : (
            <ExpenseChartPanel 
              expenses={filteredExpenses}
              categories={categories}
              budgets={budgets}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default ExpenseDetailPage;