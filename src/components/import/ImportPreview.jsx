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
  const [editMode, setEditMode] = useState(null); // ID do item sendo editado ou null
  const [editObservacao, setEditObservacao] = useState('');
  const [totalValor, setTotalValor] = useState(0); // Estado para armazenar o valor total
  
  // Listas pré-definidas de orçamentos e categorias
  const orcamentoOptions = [
    'Rede Única de Baterias', 
    'Baterias Bats', 
    'João de Barro', 
    'Imobiliária',
    'Apucarana ', 
    'Alan', 
    'Alexandre', 
    'Wellington', 
    'Heitor', 
    'Reação', 
    'Cassia', 
    'Carlos',
    'Marketplace'
  ];
  
  const categoriaOptions = [
    'MATERIAIS GRÁFICOS',
    'EVENTO',
    'FRANK',
    'BRINDE (cheirinho, lixinho, tapetes e balas)',
    'RÁDIO',
    'MARKETING DIGITAL',
    'MANUTENÇÃO',
    'MURO',
    'MANUTENÇÃO/LIMPEZA'
  ];
  
  useEffect(() => {
    if (previewData && previewData.length > 0) {
      try {
        // Garante que estamos preservando os valores exatos como vieram
        const preservedData = previewData.map((item, index) => {
          return {
            ...item,
            id: index, // Adiciona um ID único para cada linha
            selected: false, // Adiciona um estado de seleção para cada linha
            _original_valorPago: item.valorPago // Preserva o valor original para exibição
          };
        });
        
        setData(preservedData);
        
        // Calcula o total dos valores importados
        calcularTotal(preservedData);
      } catch (error) {
        console.error("Erro ao processar dados:", error);
      }
    }
  }, [previewData]);
  
  // Função para calcular o total dos valores monetários
  const calcularTotal = (items) => {
    try {
      // Inicia o valor total em 0
      let total = 0;
      
      // Itera por cada item e soma o valor monetário
      items.forEach((item, index) => {
        // Usa o valor original para cálculo
        const valorItem = extrairValorNumerico(item._original_valorPago || item.valorPago);
        total += valorItem;
      });
      
      // Atualiza o estado com o total calculado
      setTotalValor(total);
    } catch (error) {
      console.error("Erro ao calcular o total:", error);
      setTotalValor(0); // Define como 0 em caso de erro
    }
  };
  
  // Função para extrair o valor numérico de uma string de valor monetário
  const extrairValorNumerico = (valor) => {
    if (valor === null || valor === undefined) return 0;
    
    // Se já for um número, apenas retorna
    if (typeof valor === 'number') return valor;
    
    // Se for string, faz o processamento
    if (typeof valor === 'string') {
      // Remove todos os caracteres que não são dígitos, ponto ou vírgula
      let valorLimpo = valor.replace(/[^\d.,]/g, '');
      
      // Se não houver números, retorna 0
      if (valorLimpo === '' || valorLimpo === '.' || valorLimpo === ',') return 0;
      
      // Formato brasileiro com ponto como separador de milhar e vírgula como decimal
      if (valorLimpo.includes('.') && valorLimpo.includes(',')) {
        valorLimpo = valorLimpo.replace(/\./g, '').replace(',', '.');
      } 
      // Apenas com vírgula (como decimal)
      else if (valorLimpo.includes(',')) {
        valorLimpo = valorLimpo.replace(',', '.');
      }
      
      const numero = parseFloat(valorLimpo);
      return isNaN(numero) ? 0 : numero;
    }
    
    return 0;
  };
  
  const formatValue = (field, value) => {
    if (field === 'valorPago') {
      // Se for um número, formata para exibição
      if (typeof value === 'number') {
        return `R$ ${value.toFixed(2).replace('.', ',')}`;
      }
      
      // Se já for uma string formatada (e tiver R$), simplesmente retorne-a
      if (typeof value === 'string' && value.includes('R$')) {
        return value;
      }
      
      // Tenta converter para número
      const numValue = extrairValorNumerico(value);
      
      // Formata como valor monetário
      return `R$ ${numValue.toFixed(2).replace('.', ',')}`;
    } else if (field === 'dataDespesa' && value) {
      // Código para formatação de datas
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
        // Validação já realizada na conversão
        if (item._valor_numerico === 0 && item.valorPago && item.valorPago !== "0") {
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
      const cleanData = data.map(({ id, selected, _original_valorPago, _valor_numerico, ...item }) => {
        // Use o valor original se disponível
        return {
          ...item,
          valorPago: _original_valorPago || item.valorPago
        };
      });
      onConfirm(cleanData);
    }
  };
  
  const handleRowSelection = (id) => {
    const newData = data.map(item => {
      if (item.id === id) {
        return { ...item, selected: !item.selected };
      }
      return item;
    });
    
    setData(newData);
    
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
    
    const newData = data.map(item => {
      if (item.selected) {
        return {
          ...item,
          categoria: bulkCategory || item.categoria,
          orcamento: bulkOrcamento || item.orcamento
        };
      }
      return item;
    });
    
    setData(newData);
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

  // Nova função para iniciar edição de observação
  const startEditObservacao = (id, observacao) => {
    setEditMode(id);
    setEditObservacao(observacao || '');
  };

  // Nova função para salvar edição de observação
  const saveEditObservacao = () => {
    if (editMode !== null) {
      handleSingleEdit(editMode, 'observacao', editObservacao);
      setEditMode(null);
      setEditObservacao('');
    }
  };

  // Nova função para cancelar edição de observação
  const cancelEditObservacao = () => {
    setEditMode(null);
    setEditObservacao('');
  };

  // Nova função para excluir um lançamento
  const handleDeleteRow = (id) => {
    if (window.confirm('Tem certeza que deseja excluir este lançamento?')) {
      const newData = data.filter(item => item.id !== id);
      setData(newData);
      
      // Recalcula o total após a exclusão
      calcularTotal(newData);
      
      // Também remove da lista de selecionados, se estiver
      setSelectedRows(prevSelected => prevSelected.filter(rowId => rowId !== id));
    }
  };
  
  // Função para formatar o valor monetário para exibição
  const formatarValorTotal = (valor) => {
    // Formata o valor como moeda brasileira (R$ 0.000,00)
    return `R$ ${valor.toFixed(2).replace('.', ',')}`;
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
              <th className="actions-column">Ações</th>
            </tr>
          </thead>
          <tbody>
            {/* Linhas de dados */}
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
                <td>
                  {editMode === item.id ? (
                    <div className="edit-observacao-container">
                      <textarea
                        value={editObservacao}
                        onChange={(e) => setEditObservacao(e.target.value)}
                        className="edit-observacao-textarea"
                      />
                      <div className="edit-actions">
                        <button 
                          className="save-edit-button" 
                          onClick={saveEditObservacao}
                        >
                          Salvar
                        </button>
                        <button 
                          className="cancel-edit-button" 
                          onClick={cancelEditObservacao}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="observacao-text" onClick={() => startEditObservacao(item.id, item.observacao)}>
                      {item.observacao}
                      <span className="edit-icon">✎</span>
                    </div>
                  )}
                </td>
                <td className="column-value-monetary">
                  {/* Exibe o valor original exatamente como veio da importação */}
                  {item._original_valorPago || item.valorPago}
                </td>
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
                <td className="actions-column">
                  <button 
                    className="delete-row-button" 
                    onClick={() => handleDeleteRow(item.id)}
                    title="Excluir lançamento"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
            
            {/* Linha de Total */}
            <tr className="total-row">
              <td colSpan="4" className="total-label">TOTAL:</td>
              <td className="column-value-monetary total-value">{formatarValorTotal(totalValor)}</td>
              <td colSpan="3"></td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div className="preview-notice">
        Visualizando todos os {totalRecords} registros para importação.
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