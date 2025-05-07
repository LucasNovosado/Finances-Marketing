// src/components/dashboard/FinancialSummary.jsx

import React, { useState, useEffect } from 'react';
import { Info, X, Check } from 'lucide-react';
import expenseService from '../../services/expenseService';
import faturamentoService from '../../services/faturamentoService';
import './FinancialSummary.css';

const FinancialSummary = ({ filters }) => {
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expensesByBudget, setExpensesByBudget] = useState([]);
  // Armazenar quais orçamentos estão incluídos no cálculo
  const [includedBudgets, setIncludedBudgets] = useState({});
  
  const [rawFinancialData, setRawFinancialData] = useState({
    allExpenses: [],
    totalDespesasOriginal: 0,
    faturamentoCheio: 0,
    faturamentoSemSucata: 0,
    limitePercentual: 1, // Agora definido como 1%
  });
  
  // Dados financeiros calculados com base nos orçamentos selecionados
  const [calculatedData, setCalculatedData] = useState({
    totalDespesas: 0,
    percentualComSucata: 0,
    percentualSemSucata: 0,
    valorLimite: 0,
    percentualUtilizado: 0,
  });

  // Valor ideal para percentual de faturamento (1%)
  const valorIdeal = 1;

  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        setLoading(true);

        // Buscar todas as despesas para o período
        const allExpenses = await expenseService.getAllExpenses({
          mes: filters.mes,
          ano: filters.ano
        });

        // Buscar dados consolidados
        const totalDespesas = await expenseService.getTotalDespesas(filters.mes, filters.ano);
        const fatDetalhado = await faturamentoService.getFaturamentoByMonthYear(filters.mes, filters.ano);
        const fatCheio = fatDetalhado.totalComSucata;
        const fatSucata = fatDetalhado.totalSemSucata;
        
        // Definir limite como 1% em vez de obter do serviço
        const limitePercentual = 1;
        
        // Agrupar despesas por orçamento
        const budgetGroups = {};
        allExpenses.forEach(expense => {
          const orcamento = expense.orcamento || 'Sem Orçamento';
          if (!budgetGroups[orcamento]) {
            budgetGroups[orcamento] = {
              total: 0,
              count: 0,
              name: orcamento
            };
          }
          budgetGroups[orcamento].total += Number(expense.valorPago) || 0;
          budgetGroups[orcamento].count += 1;
        });
        
        // Converter para array e ordenar por valor
        const budgetArray = Object.values(budgetGroups).sort((a, b) => b.total - a.total);
        
        // Inicializar todos os orçamentos como incluídos
        const initialIncludedBudgets = {};
        budgetArray.forEach(budget => {
          initialIncludedBudgets[budget.name] = true;
        });
        
        setIncludedBudgets(initialIncludedBudgets);
        setExpensesByBudget(budgetArray);
        
        // Armazenar dados brutos para recálculos futuros
        setRawFinancialData({
          allExpenses,
          totalDespesasOriginal: totalDespesas,
          faturamentoCheio: fatCheio,
          faturamentoSemSucata: fatSucata,
          limitePercentual: limitePercentual, // Usar 1% em vez do valor do banco
        });
        
        // Cálculos iniciais (com todos os orçamentos incluídos)
        const percentualComSucata = fatCheio > 0 ? (totalDespesas / fatCheio * 100) : 0;
        const percentualSemSucata = fatSucata > 0 ? (totalDespesas / fatSucata * 100) : 0;
        const valorLimiteCom = fatCheio * limitePercentual / 100;
        const percentualUtilizadoComSucata = valorLimiteCom > 0 ? (totalDespesas / valorLimiteCom * 100) : 0;
        
        setCalculatedData({
          totalDespesas,
          percentualComSucata,
          percentualSemSucata, 
          valorLimite: valorLimiteCom,
          percentualUtilizado: percentualUtilizadoComSucata
        });

        setError('');
      } catch (err) {
        console.error('Erro ao carregar dados financeiros:', err);
        setError('Não foi possível carregar os dados financeiros. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchFinancialData();
  }, [filters]);

  // Função para recalcular os valores financeiros quando os orçamentos selecionados mudam
  useEffect(() => {
    if (Object.keys(includedBudgets).length === 0 || loading) return;
    
    // Calcular o total de despesas dos orçamentos selecionados
    const filteredTotal = expensesByBudget
      .filter(budget => includedBudgets[budget.name])
      .reduce((sum, budget) => sum + budget.total, 0);
      
    // Recalcular percentuais com o novo total
    const { faturamentoCheio, faturamentoSemSucata, limitePercentual } = rawFinancialData;
    const percentualComSucata = faturamentoCheio > 0 ? (filteredTotal / faturamentoCheio * 100) : 0;
    const percentualSemSucata = faturamentoSemSucata > 0 ? (filteredTotal / faturamentoSemSucata * 100) : 0;
    const valorLimiteCom = faturamentoCheio * limitePercentual / 100;
    const percentualUtilizado = valorLimiteCom > 0 ? (filteredTotal / valorLimiteCom * 100) : 0;
    
    setCalculatedData({
      totalDespesas: filteredTotal,
      percentualComSucata,
      percentualSemSucata,
      valorLimite: valorLimiteCom,
      percentualUtilizado
    });
  }, [includedBudgets, expensesByBudget, rawFinancialData, loading]);

  // Alterna a inclusão/exclusão de um orçamento
  const toggleBudget = (budgetName) => {
    setIncludedBudgets(prev => ({
      ...prev,
      [budgetName]: !prev[budgetName]
    }));
  };

  // Seleciona todos os orçamentos
  const selectAllBudgets = () => {
    const allSelected = {};
    expensesByBudget.forEach(budget => {
      allSelected[budget.name] = true;
    });
    setIncludedBudgets(allSelected);
  };

  // Deseleciona todos os orçamentos
  const deselectAllBudgets = () => {
    const allDeselected = {};
    expensesByBudget.forEach(budget => {
      allDeselected[budget.name] = false;
    });
    setIncludedBudgets(allDeselected);
  };

  // Obter classe de cor de status com base no percentual de utilização
  const getStatusColor = () => {
    const { percentualUtilizado } = calculatedData;
    if (percentualUtilizado < 100) return 'status-safe';
    if (percentualUtilizado < 120) return 'status-warning';
    if (percentualUtilizado < 150) return 'status-alert';
    return 'status-danger';
  };

  // Determinar a cor do percentual com base no valor ideal
  const getPercentColor = (percentual) => {
    return percentual <= valorIdeal ? 'status-safe' : '';
  };

  // Formatar valores numéricos
  const formatCurrency = (value) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatPercent = (value) =>
    new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value / 100);

  if (loading) return <div className="financial-summary-loading">Carregando dados financeiros...</div>;
  if (error) return <div className="financial-summary-error">{error}</div>;

  return (
    <div className="financial-summary">
      <div className="financial-summary-card">
        <div className="financial-summary-header">
          <h3>Análise Financeira</h3>
          <button className="info-button" onClick={() => setShowPopup(true)} aria-label="Ver detalhes do faturamento">
            <Info size={20} />
          </button>
        </div>

        <div className="financial-summary-metrics">
          <div className="metric-group">
            <div className="metric">
              <div className="metric-label">% do Faturamento COM Sucata</div>
              <div className={`metric-value ${getPercentColor(calculatedData.percentualComSucata)}`}>
                {formatPercent(calculatedData.percentualComSucata)}
              </div>
            </div>

            <div className="metric">
              <div className="metric-label">% do Faturamento SEM Sucata</div>
              <div className={`metric-value ${getPercentColor(calculatedData.percentualSemSucata)}`}>
                {formatPercent(calculatedData.percentualSemSucata)}
              </div>
            </div>
          </div>

          <div className="utilization-meter">
            <div className="utilization-label">
              <span>Utilização do Limite COM Sucata</span>
              <span className={getStatusColor()}>
                {formatPercent(calculatedData.percentualUtilizado)}
              </span>
            </div>
            <div className="progress-bar">
              <div
                className={`progress-fill ${getStatusColor()}`}
                style={{ width: `${Math.min(calculatedData.percentualUtilizado, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {showPopup && (
        <div className="financial-popup-overlay" onClick={() => setShowPopup(false)}>
          <div className="financial-popup financial-popup-medium" onClick={(e) => e.stopPropagation()}>
            <div className="financial-popup-header">
              <h3>Resumo Financeiro</h3>
              <button className="close-button" onClick={() => setShowPopup(false)}>&times;</button>
            </div>

            <div className="financial-popup-content">
              <div className="total-expenses-card">
                <h4>Total de Despesas</h4>
                <div className="total-expenses-value">
                  {formatCurrency(calculatedData.totalDespesas)}
                </div>
                <div className="expenses-diff">
                  {calculatedData.totalDespesas !== rawFinancialData.totalDespesasOriginal && (
                    <span>
                      Original: {formatCurrency(rawFinancialData.totalDespesasOriginal)}
                      {calculatedData.totalDespesas < rawFinancialData.totalDespesasOriginal 
                        ? ` (${formatPercent(calculatedData.totalDespesas / rawFinancialData.totalDespesasOriginal)} do total)`
                        : ''}
                    </span>
                  )}
                </div>
              </div>

              <div className="financial-summary-details">
                <div className="popup-detail-group">
                  <div className="popup-detail">
                    <div className="popup-detail-label">Faturamento Total (com sucata)</div>
                    <div className="popup-detail-value">{formatCurrency(rawFinancialData.faturamentoCheio)}</div>
                  </div>
                  <div className="popup-detail">
                    <div className="popup-detail-label">Faturamento (sem sucata)</div>
                    <div className="popup-detail-value">{formatCurrency(rawFinancialData.faturamentoSemSucata)}</div>
                  </div>
                </div>

                <div className="popup-detail-group">
                  <div className="popup-detail">
                    <div className="popup-detail-label">Percentual do Faturamento COM Sucata</div>
                    <div className={`popup-detail-value ${getPercentColor(calculatedData.percentualComSucata)}`}>
                      {formatPercent(calculatedData.percentualComSucata)}
                    </div>
                  </div>
                  <div className="popup-detail">
                    <div className="popup-detail-label">Percentual do Faturamento SEM Sucata</div>
                    <div className={`popup-detail-value ${getPercentColor(calculatedData.percentualSemSucata)}`}>
                      {formatPercent(calculatedData.percentualSemSucata)}
                    </div>
                  </div>
                </div>

                <div className="popup-detail-group">
                  <div className="popup-detail">
                    <div className="popup-detail-label">Limite Máximo (1%)</div>
                    <div className="popup-detail-value">{formatCurrency(calculatedData.valorLimite)}</div>
                  </div>
                  <div className="popup-detail">
                    <div className="popup-detail-label">Utilização do Limite</div>
                    <div className={`popup-detail-value ${getStatusColor()}`}>
                      {formatPercent(calculatedData.percentualUtilizado)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="budget-selection-section">
                <div className="budget-selection-header">
                  <h4>Orçamentos Incluídos no Cálculo</h4>
                  <div className="budget-selection-actions">
                    <button className="select-all-btn" onClick={selectAllBudgets}>Selecionar Todos</button>
                    <button className="deselect-all-btn" onClick={deselectAllBudgets}>Desmarcar Todos</button>
                  </div>
                </div>
                
                <div className="budget-selection-list">
                  {expensesByBudget.map((budget, index) => (
                    <div 
                      key={index} 
                      className={`budget-selection-item ${includedBudgets[budget.name] ? 'selected' : ''}`}
                      onClick={() => toggleBudget(budget.name)}
                    >
                      <div className="budget-selection-checkbox">
                        {includedBudgets[budget.name] ? (
                          <Check size={18} className="check-icon" />
                        ) : (
                          <X size={18} className="x-icon" />
                        )}
                      </div>
                      <div className="budget-selection-name">{budget.name}</div>
                      <div className="budget-selection-value">{formatCurrency(budget.total)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="popup-status-message">
                <div className={`status-indicator ${getStatusColor()}`}></div>
                <div className="status-text">
                  {calculatedData.percentualUtilizado < 100
                    ? 'Status: Seguro - Despesas dentro do limite recomendado'
                    : calculatedData.percentualUtilizado < 120
                    ? 'Status: Atenção - Monitorar despesas'
                    : calculatedData.percentualUtilizado < 150
                    ? 'Status: Alerta - Próximo do limite máximo'
                    : 'Status: Crítico - Limite excedido'}
                </div>
              </div>
            </div>

            <div className="financial-popup-footer">
              <div className="popup-footer-info">
                <span>Período: {filters.mes}/{filters.ano}</span>
                <span>Orçamentos selecionados: {Object.values(includedBudgets).filter(Boolean).length} de {expensesByBudget.length}</span>
              </div>
              <button className="close-popup-button" onClick={() => setShowPopup(false)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialSummary;