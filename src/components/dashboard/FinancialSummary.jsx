// src/components/dashboard/FinancialSummary.jsx

// ... imports mantidos
import React, { useState, useEffect } from 'react';
import { Info } from 'lucide-react';
import expenseService from '../../services/expenseService';
import faturamentoService from '../../services/faturamentoService';
import './FinancialSummary.css';

const FinancialSummary = ({ filters }) => {
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [financialData, setFinancialData] = useState({
    totalDespesas: 0,
    faturamentoCheio: 0,
    faturamentoSemSucata: 0,
    limitePercentual: 0.75,
    percentualGasto: 0,
    valorLimite: 0,
    percentualUtilizado: 0,
    percentualComSucata: 0,
    percentualSemSucata: 0
  });

  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        setLoading(true);

        const totalDespesas = await expenseService.getTotalDespesas(filters.mes, filters.ano);
        const fatDetalhado = await faturamentoService.getFaturamentoByMonthYear(filters.mes, filters.ano);
        const fatCheio = fatDetalhado.totalComSucata;
        const fatSucata = fatDetalhado.totalSemSucata;
        const limite = await faturamentoService.getLimitesDespesa(filters.mes, filters.ano) || { percentualFatCheio: 0.75 };

// Substitua dentro de useEffect:

const percentualComSucata = fatCheio > 0 ? (totalDespesas / fatCheio * 100) : 0;
const percentualSemSucata = fatSucata > 0 ? (totalDespesas / fatSucata * 100) : 0;

const valorLimiteCom = fatCheio * limite.percentualFatCheio / 100;
const valorLimiteSem = fatSucata * limite.percentualFatCheio / 100;

const percentualUtilizadoComSucata = valorLimiteCom > 0 ? (totalDespesas / valorLimiteCom * 100) : 0;
const percentualUtilizadoSemSucata = valorLimiteSem > 0 ? (totalDespesas / valorLimiteSem * 100) : 0;


        setFinancialData({
            totalDespesas,
            faturamentoCheio: fatCheio,
            faturamentoSemSucata: fatSucata,
            limitePercentual: limite.percentualFatCheio,
            percentualGasto: percentualComSucata,
            valorLimite: valorLimiteCom,
            percentualUtilizado: percentualUtilizadoComSucata,
            percentualComSucata,
            percentualSemSucata,
            percentualUtilizadoComSucata,
            percentualUtilizadoSemSucata
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

  const getStatusColor = () => {
    const { percentualUtilizado } = financialData;
    if (percentualUtilizado < 75) return 'status-safe';
    if (percentualUtilizado < 90) return 'status-warning';
    if (percentualUtilizado < 100) return 'status-alert';
    return 'status-danger';
  };

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
              <div className={`metric-value ${getStatusColor()}`}>
                {formatPercent(financialData.percentualComSucata)}
              </div>
            </div>

            <div className="metric">
              <div className="metric-label">% do Faturamento SEM Sucata</div>
              <div className="metric-value">
                {formatPercent(financialData.percentualSemSucata)}
              </div>
            </div>
          </div>

          <div className="utilization-meter">
  <div className="utilization-label">
    <span>Utilização do Limite COM Sucata</span>
    <span className={getStatusColor()}>
      {formatPercent(financialData.percentualUtilizadoComSucata)}
    </span>
  </div>
  <div className="progress-bar">
    <div
      className={`progress-fill ${getStatusColor()}`}
      style={{ width: `${Math.min(financialData.percentualUtilizadoComSucata, 100)}%` }}
    ></div>
  </div>

  <div className="utilization-label" style={{ marginTop: '1rem' }}>
    <span>Utilização do Limite SEM Sucata</span>
    <span className={getStatusColor()}>
      {formatPercent(financialData.percentualUtilizadoSemSucata)}
    </span>
  </div>
  <div className="progress-bar">
    <div
      className={`progress-fill ${getStatusColor()}`}
      style={{ width: `${Math.min(financialData.percentualUtilizadoSemSucata, 100)}%` }}
    ></div>
  </div>
</div>

        </div>
      </div>

      {showPopup && (
        <div className="financial-popup-overlay" onClick={() => setShowPopup(false)}>
          <div className="financial-popup" onClick={(e) => e.stopPropagation()}>
            <div className="financial-popup-header">
              <h3>Detalhes do Faturamento</h3>
              <button className="close-button" onClick={() => setShowPopup(false)}>&times;</button>
            </div>

            <div className="financial-popup-content">
              <div className="popup-detail-group">
                <div className="popup-detail">
                  <div className="popup-detail-label">Faturamento Total (com sucata)</div>
                  <div className="popup-detail-value">{formatCurrency(financialData.faturamentoCheio)}</div>
                </div>
                <div className="popup-detail">
                  <div className="popup-detail-label">Faturamento (sem sucata)</div>
                  <div className="popup-detail-value">{formatCurrency(financialData.faturamentoSemSucata)}</div>
                </div>
              </div>

              <div className="popup-detail-group">
                <div className="popup-detail">
                  <div className="popup-detail-label">Percentual do Faturamento COM Sucata</div>
                  <div className="popup-detail-value">{formatPercent(financialData.percentualComSucata)}</div>
                </div>
                <div className="popup-detail">
                  <div className="popup-detail-label">Percentual do Faturamento SEM Sucata</div>
                  <div className="popup-detail-value">{formatPercent(financialData.percentualSemSucata)}</div>
                </div>
              </div>

              <div className="popup-detail-group">
                <div className="popup-detail">
                  <div className="popup-detail-label">Limite Máximo ({financialData.limitePercentual}%)</div>
                  <div className="popup-detail-value">{formatCurrency(financialData.valorLimite)}</div>
                </div>
                <div className="popup-detail">
                  <div className="popup-detail-label">Utilização do Limite</div>
                  <div className={`popup-detail-value ${getStatusColor()}`}>
                    {formatPercent(financialData.percentualUtilizado)}
                  </div>
                </div>
              </div>

              <div className="popup-status-message">
                <div className={`status-indicator ${getStatusColor()}`}></div>
                <div className="status-text">
                  {financialData.percentualUtilizado < 75
                    ? 'Status: Seguro - Despesas dentro do limite recomendado'
                    : financialData.percentualUtilizado < 90
                    ? 'Status: Atenção - Monitorar despesas'
                    : financialData.percentualUtilizado < 100
                    ? 'Status: Alerta - Próximo do limite máximo'
                    : 'Status: Crítico - Limite excedido'}
                </div>
              </div>
            </div>

            <div className="financial-popup-footer">
              <button className="close-popup-button" onClick={() => setShowPopup(false)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialSummary;
