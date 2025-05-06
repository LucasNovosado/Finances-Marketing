// src/components/import/ImportPreview.jsx

import React, { useState, useEffect } from 'react';
import './ImportPreview.css';

const ImportPreview = ({ 
  previewData, 
  totalRecords, 
  onConfirm, 
  onBack, 
  loading 
}) => {
  const [data, setData] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [bulkCategory, setBulkCategory] = useState('');
  const [bulkOrcamento, setBulkOrcamento] = useState('');
  
  
  // Listas pré-definidas de orçamentos e categorias
  const orcamentoOptions = [
    'Rede Única de Baterias', 
    'Baterias Bats', 
    'João de Barro', 
    'Imobiliária', 
    'Alan', 
    'Alexandre', 
    'Wellington', 
    'Heitor', 
    'Reação', 
    'Cassia', 
    'Carlos'
  ];
  
  const categoriaOptions = [
    'PANFLETO / PANFLETAGEM / CARDÁPIO',
    'EVENTO',
    'FRANK',
    'BRINDE (cheirinho, lixinho, tapetes e balas)',
    'RÁDIO',
    'MARKETING DIGITAL',
    'MANUTENÇÃO'
  ];
  
  useEffect(() => {
    if (previewData && previewData.length > 0) {
      setData(previewData.map((item, index) => ({
        ...item,
        id: index, // Adiciona um ID único para cada linha
        selected: false // Adiciona um estado de seleção para cada linha
      })));
    }
  }, [previewData]);
  
  const formatValue = (field, value) => {
    if (field === 'valorPago') {
      // Formata valores monetários
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        return `R$ ${numValue.toFixed(2).replace('.', ',')}`;
      }
    } else if (field === 'dataDespesa' && value) {
      // Formata datas
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('pt-BR');
      }
    }
    
    // Retorna o valor original se não for necessário formatar
    return value;
  };
  
  const getFieldClass = (field, value) => {
    if (field === 'valorPago') {
      return 'column-value-monetary';
    } else if (field === 'dataDespesa') {
      return 'column-value-date';
    }
    return '';
  };
  
  // Função para validar a integridade dos dados antes de confirmar a importação
  const validateData = () => {
    const errors = [];
    
    // Verifica se há valores obrigatórios faltando
    data.forEach((item, index) => {
      const rowErrors = [];
      
      if (!item.empresa) {
        rowErrors.push('Empresa');
      }
      
      if (!item.valorPago && item.valorPago !== 0) {
        rowErrors.push('Valor Pago');
      } else {
        // Valida se o valor pago é um número válido
        const numValue = typeof item.valorPago === 'string' 
          ? parseFloat(item.valorPago.replace(/[^\d.,]/g, '').replace(',', '.'))
          : item.valorPago;
          
        if (isNaN(numValue)) {
          rowErrors.push('Valor Pago (formato inválido)');
        }
      }
      
      if (!item.orcamento) {
        rowErrors.push('Orçamento');
      }
      
      if (!item.categoria) {
        rowErrors.push('Categoria');
      }
      
      if (rowErrors.length > 0) {
        errors.push(`Linha ${index + 1}: Campos obrigatórios faltando - ${rowErrors.join(', ')}`);
      }
    });
    
    setValidationErrors(errors);
    return errors.length === 0;
  };
  
  const handleImportConfirm = () => {
    if (validateData()) {
      // Remove as propriedades auxiliares antes de enviar os dados
      const cleanData = data.map(({ id, selected, ...item }) => item);
      onConfirm(cleanData);
    }
  };
  
  const handleRowSelection = (id) => {
    setData(prevData => prevData.map(item => {
      if (item.id === id) {
        return { ...item, selected: !item.selected };
      }
      return item;
    }));
    
    setSelectedRows(prevSelected => {
      if (prevSelected.includes(id)) {
        return prevSelected.filter(rowId => rowId !== id);
      } else {
        return [...prevSelected, id];
      }
    });
  };
  
  const handleSelectAll = () => {
    const allSelected = data.every(item => item.selected);
    
    setData(prevData => prevData.map(item => ({
      ...item,
      selected: !allSelected
    })));
    
    if (allSelected) {
      setSelectedRows([]);
    } else {
      setSelectedRows(data.map(item => item.id));
    }
  };
  
  const handleBulkEdit = () => {
    if (selectedRows.length === 0) return;
    
    setData(prevData => prevData.map(item => {
      if (item.selected) {
        return {
          ...item,
          categoria: bulkCategory || item.categoria,
          orcamento: bulkOrcamento || item.orcamento
        };
      }
      return item;
    }));
    
    setBulkCategory('');
    setBulkOrcamento('');
    setBulkEditMode(false);
  };
  
  const handleSingleEdit = (id, field, value) => {
    setData(prevData => prevData.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };
  
  return (
    <div className="preview-container">
      <div className="preview-header">
        <h3>Revisão dos Dados</h3>
        <div className="preview-stats">
          Mostrando {data?.length || 0} de {totalRecords} registros
        </div>
      </div>
      
      {validationErrors.length > 0 && (
        <div className="mapping-error">
          <strong>Existem erros que precisam ser corrigidos:</strong>
          <ul>
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="preview-warning">
        <h4>Verifique os dados antes de confirmar a importação</h4>
        <p>
          Os campos Orçamento e Categoria precisam ser preenchidos manualmente.
          Você pode selecionar múltiplas linhas para preencher de uma vez.
        </p>
      </div>
      
      {selectedRows.length > 0 && (
        <div className="bulk-edit-controls">
          <div className="selected-count">
            {selectedRows.length} {selectedRows.length === 1 ? 'item selecionado' : 'itens selecionados'}
          </div>
          
          {bulkEditMode ? (
            <div className="bulk-edit-form">
              <div className="bulk-edit-fields">
                <div className="bulk-field">
                  <label>Orçamento:</label>
                  <select
                    value={bulkOrcamento}
                    onChange={(e) => setBulkOrcamento(e.target.value)}
                    className="field-select"
                  >
                    <option value="">Selecione um orçamento...</option>
                    {orcamentoOptions.map((option, index) => (
                      <option key={index} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                
                <div className="bulk-field">
                  <label>Categoria:</label>
                  <select
                    value={bulkCategory}
                    onChange={(e) => setBulkCategory(e.target.value)}
                    className="field-select"
                  >
                    <option value="">Selecione uma categoria...</option>
                    {categoriaOptions.map((option, index) => (
                      <option key={index} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="bulk-edit-actions">
                <button
                  className="bulk-apply-button"
                  onClick={handleBulkEdit}
                >
                  Aplicar
                </button>
                <button
                  className="bulk-cancel-button"
                  onClick={() => setBulkEditMode(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              className="enable-bulk-edit-button"
              onClick={() => setBulkEditMode(true)}
            >
              Editar Selecionados
            </button>
          )}
        </div>
      )}
      
      <div className="preview-table-container">
        <table className="preview-table">
          <thead>
            <tr>
              <th className="selection-column">
                <input
                  type="checkbox"
                  checked={data.length > 0 && data.every(item => item.selected)}
                  onChange={handleSelectAll}
                />
              </th>
              <th>Empresa</th>
              <th>Fornecedor</th>
              <th>Observação</th>
              <th>Valor Pago</th>
              <th>Orçamento</th>
              <th>Categoria</th>
              <th>Mês</th>
              <th>Ano</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.id} className={item.selected ? 'selected-row' : ''}>
                <td className="selection-column">
                  <input
                    type="checkbox"
                    checked={item.selected}
                    onChange={() => handleRowSelection(item.id)}
                  />
                </td>
                <td>{item.empresa}</td>
                <td>{item.fornecedor}</td>
                <td>{item.observacao}</td>
                <td className="column-value-monetary">{formatValue('valorPago', item.valorPago)}</td>
                <td>
                  <select
                    value={item.orcamento || ''}
                    onChange={(e) => handleSingleEdit(item.id, 'orcamento', e.target.value)}
                    className="field-select"
                  >
                    <option value="">Selecione...</option>
                    {orcamentoOptions.map((option, idx) => (
                      <option key={idx} value={option}>{option}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <select
                    value={item.categoria || ''}
                    onChange={(e) => handleSingleEdit(item.id, 'categoria', e.target.value)}
                    className="field-select"
                  >
                    <option value="">Selecione...</option>
                    {categoriaOptions.map((option, idx) => (
                      <option key={idx} value={option}>{option}</option>
                    ))}
                  </select>
                </td>
                <td>{item.mes}</td>
                <td>{item.ano}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="preview-notice">
        Nota: Esta é apenas uma amostra dos primeiros registros. A importação será feita para todos os {totalRecords} registros.
      </div>
      
      <div className="preview-actions">
        <button 
          className="preview-back-button" 
          onClick={onBack}
          disabled={loading}
        >
          ← Voltar ao Mapeamento
        </button>
        <button 
          className="preview-confirm-button" 
          onClick={handleImportConfirm}
          disabled={loading || validationErrors.length > 0}
        >
          {loading ? 'Importando...' : 'Confirmar Importação'}
        </button>
      </div>
    </div>
  );
};

export default ImportPreview;