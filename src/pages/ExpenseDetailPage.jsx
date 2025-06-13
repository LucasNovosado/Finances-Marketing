// src/pages/ExpenseDetailPage.jsx - VERSÃO COMPLETA COM POPUP DE ADICIONAR DESPESA

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import ExpenseFilterPanel from '../components/expenses/ExpenseFilterPanel';
import ExpenseDetailTable from '../components/expenses/ExpenseDetailTable';
import ExpenseChartPanel from '../components/expenses/ExpenseChartPanel';
import ExpenseSummaryStats from '../components/expenses/ExpenseSummaryStats';
import AddExpensePopup from '../components/expenses/AddExpensePopup';
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
  const [showAddExpensePopup, setShowAddExpensePopup] = useState(false);
  
  // Filtros atualizados para trabalhar com mês/ano
  const currentDate = new Date();
  const [filters, setFilters] = useState({
    startMonth: currentDate.getMonth() + 1, // Mês atual
    startYear: currentDate.getFullYear(),   // Ano atual
    endMonth: currentDate.getMonth() + 1,   // Mesmo mês
    endYear: currentDate.getFullYear(),     // Mesmo ano
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
          expenseService.getAllExpenses({}), // Busca todas inicialmente
          expenseService.getAvailableCategories(),
          expenseService.getAvailableBudgets()
        ]);
        
        setExpenses(expensesData);
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

  // Aplicar filtros quando mudarem - VERSÃO ATUALIZADA PARA MÊS/ANO
  useEffect(() => {
    if (expenses.length === 0) {
      setFilteredExpenses([]);
      return;
    }
    
    const applyFilters = () => {
      console.log('Aplicando filtros:', filters);
      
      const result = expenses.filter(expense => {
        // FILTRO DE PERÍODO POR MÊS/ANO
        const expenseDate = new Date(expense.dataDespesa || expense.createdAt);
        const expenseMonth = expenseDate.getMonth() + 1; // JavaScript usa mês baseado em 0
        const expenseYear = expenseDate.getFullYear();
        
        // Também considera os campos mes/ano diretamente do objeto
        const expenseMonthDirect = expense.mes || expenseMonth;
        const expenseYearDirect = expense.ano || expenseYear;
        
        // Verificar se a despesa está dentro do período selecionado
        const startPeriod = filters.startYear * 100 + filters.startMonth; // Ex: 202504 = Abril/2025
        const endPeriod = filters.endYear * 100 + filters.endMonth;       // Ex: 202506 = Junho/2025
        const expensePeriod = expenseYearDirect * 100 + expenseMonthDirect; // Ex: 202505 = Maio/2025
        
        if (expensePeriod < startPeriod || expensePeriod > endPeriod) {
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
      
      console.log(`Filtros aplicados: ${result.length} de ${expenses.length} despesas`);
      setFilteredExpenses(result);
    };
    
    applyFilters();
  }, [expenses, filters]);

  // Atualiza filtros
  const handleFilterChange = (newFilters) => {
    console.log('Alterando filtros:', newFilters);
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  };

  // Limpa todos os filtros
  const handleClearFilters = () => {
    const currentDate = new Date();
    setFilters({
      startMonth: currentDate.getMonth() + 1,
      startYear: currentDate.getFullYear(),
      endMonth: currentDate.getMonth() + 1,
      endYear: currentDate.getFullYear(),
      category: '',
      budget: '',
      minAmount: '',
      maxAmount: '',
      searchTerm: ''
    });
  };

  const handleExport = (format) => {
    // Implementar exportação para CSV/Excel
    console.log(`Exportando ${filteredExpenses.length} registros para ${format}...`);
    // expenseService.exportData(filteredExpenses, format);
  };

  // Função para lidar com o sucesso ao adicionar nova despesa
  const handleAddExpenseSuccess = async (newExpense) => {
    try {
      console.log('Nova despesa adicionada:', newExpense);
      
      // Recarregar a lista de despesas para incluir a nova
      const [expensesData] = await Promise.all([
        expenseService.getAllExpenses({}) // Busca todas novamente
      ]);
      
      setExpenses(expensesData);
      
      // Mostrar notificação de sucesso
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10001;
        font-weight: 500;
      `;
      notification.textContent = 'Despesa adicionada com sucesso!';
      document.body.appendChild(notification);

      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 3000);
      
    } catch (err) {
      console.error('Erro ao recarregar despesas:', err);
    }
  };

  // Função para obter nome do mês
  const getMesNome = (mesNumero) => {
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return meses[mesNumero - 1] || '';
  };

  // Função para obter descrição do período atual
  const getPeriodoAtual = () => {
    if (filters.startMonth === filters.endMonth && filters.startYear === filters.endYear) {
      return `${getMesNome(filters.startMonth)} de ${filters.startYear}`;
    } else {
      return `${getMesNome(filters.startMonth)}/${filters.startYear} até ${getMesNome(filters.endMonth)}/${filters.endYear}`;
    }
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
        <div>
          <h1>Detalhamento de Despesas</h1>
          <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
            Período: {getPeriodoAtual()} • {filteredExpenses.length} registros encontrados
          </p>
        </div>
        <div className="page-actions">
          <button 
            className="add-expense-button"
            onClick={() => setShowAddExpensePopup(true)}
            title="Adicionar nova despesa manualmente"
          >
            <Plus size={18} />
            Adicionar Despesa
          </button>
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
              filters={filters}  // ← IMPORTANTE: Passando os filtros aqui
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

      {/* Popup para adicionar despesa */}
      <AddExpensePopup
        isOpen={showAddExpensePopup}
        onClose={() => setShowAddExpensePopup(false)}
        onSave={handleAddExpenseSuccess}
        categories={categories}
        budgets={budgets}
      />
    </div>
  );
};

export default ExpenseDetailPage;