// src/components/faturamento/FaturamentoSupervisorCard.jsx

import React from 'react';
import './FaturamentoSupervisorCard.css';

const FaturamentoSupervisorCard = ({ 
  supervisor, 
  valorComSucata, 
  valorSemSucata, 
  onChange 
}) => {
  // Formata o valor como número ao digitar
  const handleChange = (comSucata, e) => {
    const { value } = e.target;
    
    // Remove R$ e qualquer caractere que não seja número, ponto ou vírgula
    let formattedValue = value.replace(/[R$\s]/g, '').replace(/[^\d.,]/g, '');
    
    // Substitui múltiplos pontos ou vírgulas por uma única vírgula
    formattedValue = formattedValue
      .replace(/,/g, '.')  // Converte todas as vírgulas em pontos temporariamente
      .replace(/\.+/g, '.') // Remove pontos duplicados
      .replace(/\./g, ','); // Converte todos os pontos de volta para vírgulas
    
    // Se começar com vírgula, adiciona zero antes
    if (formattedValue.startsWith(',')) {
      formattedValue = '0' + formattedValue;
    }
    
    onChange(supervisor, comSucata, formattedValue);
  };
  
  // Calcula 0,25% do valor
  const calcularPercentual = (valor) => {
    if (!valor) return '0,00';
    
    // Converte o valor para número
    const numeroValor = parseFloat(valor.replace(/\./g, '').replace(',', '.'));
    
    if (isNaN(numeroValor)) return '0,00';
    
    // Calcula 0,25% do valor
    const percentual = numeroValor * 0.0025;
    
    // Formata o resultado com duas casas decimais
    return percentual.toLocaleString('pt-BR', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };
  
  return (
    <div className="faturamento-supervisor-card">
      <div className="supervisor-name">{supervisor}</div>
      
      <div className="faturamento-inputs">
        <div className="input-group">
          <label>COM Sucata:</label>
          <div className="input-wrapper">
            <span className="currency-prefix">R$</span>
            <input
              type="text"
              value={valorComSucata}
              onChange={(e) => handleChange(true, e)}
              placeholder="0,00"
              inputMode="decimal"
            />
          </div>
          <div className="percentual-value">
            <span>0,25%: R$ {calcularPercentual(valorComSucata)}</span>
          </div>
        </div>
        
        <div className="input-group">
          <label>SEM Sucata:</label>
          <div className="input-wrapper">
            <span className="currency-prefix">R$</span>
            <input
              type="text"
              value={valorSemSucata}
              onChange={(e) => handleChange(false, e)}
              placeholder="0,00"
              inputMode="decimal"
            />
          </div>
          <div className="percentual-value">
            <span>0,25%: R$ {calcularPercentual(valorSemSucata)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaturamentoSupervisorCard;