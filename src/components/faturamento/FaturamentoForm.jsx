// src/components/faturamento/FaturamentoForm.jsx

import React, { useState, useEffect } from 'react';
import FaturamentoSupervisorCard from './FaturamentoSupervisorCard';
import FaturamentoTotalCard from './FaturamentoTotalCard';
import faturamentoService from '../../services/faturamentoService';
import './FaturamentoForm.css';

const FaturamentoForm = ({ mes, ano, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [faturamento, setFaturamento] = useState({
    mes,
    ano,
    faturamentoComSucata: {},
    faturamentoSemSucata: {},
    totalComSucata: 0,
    totalSemSucata: 0
  });
  
  // Lista de supervisores
  const supervisores = [
    'Wellington', 
    'Alan', 
    'Reacao', 
    'Alexandre', 
    'Heitor', 
    'Carlos', 
    'Cassia'
  ];
  
  // Carregar dados existentes quando o mês ou ano mudarem
  useEffect(() => {
    const fetchFaturamento = async () => {
      try {
        setLoading(true);
        setError('');
        
        const result = await faturamentoService.getFaturamentoByMonthYear(mes, ano);
        setFaturamento(result);
      } catch (err) {
        console.error('Erro ao carregar faturamento:', err);
        setError('Erro ao carregar dados do faturamento. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchFaturamento();
  }, [mes, ano]);
  
  // Atualiza os valores de faturamento para um supervisor
  const handleFaturamentoChange = (supervisor, comSucata, value) => {
    setFaturamento(prev => {
      // Determina qual objeto atualizar com base no tipo (com/sem sucata)
      const targetObj = comSucata ? 'faturamentoComSucata' : 'faturamentoSemSucata';
      
      // Cria cópias dos objetos para não modificar o estado diretamente
      const updatedObj = { ...prev[targetObj], [supervisor]: value };
      
      // Calcula os novos totais
      const totalComSucata = comSucata 
        ? Object.values({ ...prev.faturamentoComSucata, [supervisor]: value }).reduce(
            (acc, val) => acc + (parseFloat(val) || 0), 0
          )
        : prev.totalComSucata;
        
      const totalSemSucata = !comSucata 
        ? Object.values({ ...prev.faturamentoSemSucata, [supervisor]: value }).reduce(
            (acc, val) => acc + (parseFloat(val) || 0), 0
          )
        : prev.totalSemSucata;
      
      // Retorna o novo estado
      return {
        ...prev,
        [targetObj]: updatedObj,
        totalComSucata,
        totalSemSucata
      };
    });
  };
  
  // Salva os dados de faturamento
  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      
      await faturamentoService.saveFaturamento(faturamento);
      
      if (onSave) {
        onSave(faturamento);
      }
    } catch (err) {
      console.error('Erro ao salvar faturamento:', err);
      setError('Erro ao salvar dados. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };
  
  // Formata um valor monetário
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  if (loading) {
    return <div className="faturamento-loading">Carregando dados...</div>;
  }
  
  return (
    <div className="faturamento-form">
      {error && <div className="faturamento-error">{error}</div>}
      
      <div className="supervisores-grid">
        {supervisores.map(supervisor => (
          <FaturamentoSupervisorCard
            key={supervisor}
            supervisor={supervisor}
            valorComSucata={faturamento.faturamentoComSucata[supervisor] || ''}
            valorSemSucata={faturamento.faturamentoSemSucata[supervisor] || ''}
            onChange={handleFaturamentoChange}
          />
        ))}
      </div>
      
      <FaturamentoTotalCard
        totalComSucata={faturamento.totalComSucata}
        totalSemSucata={faturamento.totalSemSucata}
        formatCurrency={formatCurrency}
      />
      
      <div className="faturamento-actions">
        <button
          className="save-button"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Salvando...' : 'Salvar Faturamento'}
        </button>
      </div>
    </div>
  );
};

export default FaturamentoForm;