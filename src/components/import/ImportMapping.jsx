// src/components/import/ImportMapping.jsx

import React, { useState, useEffect } from 'react';
import './ImportMapping.css';

const ImportMapping = ({ fileData, onMappingComplete, onBack }) => {
  // Objeto para armazenar o mês e ano selecionados
  const [dateInfo, setDateInfo] = useState({
    mes: new Date().getMonth() + 1, // Mês atual por padrão
    ano: new Date().getFullYear() // Ano atual por padrão
  });
  
  const [previewData, setPreviewData] = useState([]);
  const [error, setError] = useState('');
  
  // Lista de meses para o dropdown
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
  
  // Anos disponíveis (de 2020 até o ano atual + 1)
  const anoAtual = new Date().getFullYear();
  const anos = Array.from({length: anoAtual - 2019}, (_, i) => anoAtual - i);
  
  useEffect(() => {
    if (fileData && fileData.length > 0) {
      // Define uma prévia dos dados (primeiros 3 itens)
      setPreviewData(fileData.slice(0, 3));
    }
  }, [fileData]);
  
  const handleDateChange = (field, value) => {
    setDateInfo(prev => ({
      ...prev,
      [field]: parseInt(value)
    }));
  };
  
  const handleContinue = () => {
    if (!fileData || fileData.length === 0) {
      setError('Não há dados para importar.');
      return;
    }
    
    // Aplica o mapeamento automaticamente com os campos fixos:
    // - COLUNA A: Empresa
    // - COLUNA B: Fornecedor
    // - COLUNA D: Observação
    // - COLUNA M: Valor Pago
    const mappedData = fileData.map(item => {
      return {
        ...item,
        mes: dateInfo.mes,
        ano: dateInfo.ano
      };
    });
    
    onMappingComplete(mappedData);
  };
  
  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };
  
  return (
    <div className="mapping-container">
      <div className="mapping-instructions">
        <h3>Selecione o Mês e Ano das Despesas</h3>
        <p>
          Escolha o mês e ano a que se referem estas despesas. Os dados serão importados automaticamente para o sistema.
        </p>
      </div>
      
      {error && <div className="mapping-error">{error}</div>}
      
      <div className="date-selection">
        <div className="date-selection-row">
          <div className="field-name">
            Mês <span className="field-required">*</span>
          </div>
          <div>
            <select 
              className="field-select"
              value={dateInfo.mes}
              onChange={(e) => handleDateChange('mes', e.target.value)}
            >
              {meses.map(mes => (
                <option key={mes.value} value={mes.value}>
                  {mes.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="date-selection-row">
          <div className="field-name">
            Ano <span className="field-required">*</span>
          </div>
          <div>
            <select 
              className="field-select"
              value={dateInfo.ano}
              onChange={(e) => handleDateChange('ano', e.target.value)}
            >
              {anos.map(ano => (
                <option key={ano} value={ano}>
                  {ano}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      <div className="file-preview">
        <h3>Prévia dos Dados Detectados</h3>
        {previewData.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Fornecedor</th>
                <th>Observação</th>
                <th>Valor Pago</th>
              </tr>
            </thead>
            <tbody>
              {previewData.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  <td>{row.empresa}</td>
                  <td>{row.fornecedor}</td>
                  <td>{row.observacao}</td>
                  <td>{row.valorPago}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      <div className="mapping-actions">
        <button className="back-button" onClick={handleBack}>
          ← Voltar
        </button>
        <button 
          className="continue-button" 
          onClick={handleContinue}
          disabled={!fileData || fileData.length === 0}
        >
          Continuar →
        </button>
      </div>
    </div>
  );
};

export default ImportMapping;