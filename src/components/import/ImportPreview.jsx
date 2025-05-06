// src/components/import/ImportPreview.jsx

import React, { useState } from 'react';
import { saveExpensesToParse } from '../../services/importService';
import './ImportPreview.css';

const ImportPreview = ({ 
  previewData, 
  totalRecords, 
  onConfirm, 
  onBack, 
  loading 
}) => {
  const [validationErrors, setValidationErrors] = useState([]);
  
  const formatValue = (field, value) => {
    if (field === 'valorPago') {
      // Formata valores monetários
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        return numValue.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        });
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
    previewData.forEach((item, index) => {
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
      onConfirm();
    }
  };
  
  return (
    <div className="preview-container">
      <div className="preview-header">
        <h3>Revisão dos Dados</h3>
        <div className="preview-stats">
          Mostrando {previewData?.length || 0} de {totalRecords} registros
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
          Confirme se os campos foram mapeados corretamente e se os dados estão como esperado.
          Após a importação, os dados serão salvos no sistema.
        </p>
      </div>
      
      <div className="preview-table-container">
        <table className="preview-table">
          <thead>
            <tr>
              {previewData && previewData.length > 0 && Object.keys(previewData[0]).map((header, index) => (
                <th key={index}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewData && previewData.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {Object.entries(row).map(([field, value], cellIndex) => (
                  <td 
                    key={`${rowIndex}-${cellIndex}`}
                    className={getFieldClass(field, value)}
                  >
                    {formatValue(field, value)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="preview-notice">
        Note: Esta é apenas uma amostra dos primeiros registros. A importação será feita para todos os {totalRecords} registros.
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
          disabled={loading}
        >
          {loading ? 'Importando...' : 'Confirmar Importação'}
        </button>
      </div>
    </div>
  );
};

export default ImportPreview;