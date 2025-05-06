// src/components/import/ImportMapping.jsx

import React, { useState, useEffect } from 'react';
import './ImportMapping.css';

const ImportMapping = ({ fileData, onMappingComplete, onBack }) => {
  const [mapping, setMapping] = useState({
    empresa: '',
    fornecedor: '',
    observacao: '',
    valorPago: '',
    orcamento: '',
    categoria: '',
    dataDespesa: ''
  });
  
  const [availableFields, setAvailableFields] = useState([]);
  const [previewData, setPreviewData] = useState([]);
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (fileData && fileData.length > 0) {
      // Extrai todos os nomes de campos do primeiro item
      const fields = Object.keys(fileData[0]);
      setAvailableFields(fields);
      
      // Define uma prévia dos dados (primeiros 3 itens)
      setPreviewData(fileData.slice(0, 3));
      
      // Tenta mapear automaticamente campos com nomes semelhantes
      const autoMapping = {};
      
      const fieldMappingRules = {
        empresa: ['empresa', 'company', 'nome empresa', 'razao social', 'fornecedor'],
        fornecedor: ['fornecedor', 'vendor', 'nome fornecedor', 'prestador'],
        observacao: ['observacao', 'descricao', 'description', 'obs', 'detalhes', 'details'],
        valorPago: ['valor', 'valor pago', 'amount', 'price', 'custo', 'cost', 'preco'],
        orcamento: ['orcamento', 'budget', 'departamento', 'department', 'centro custo'],
        categoria: ['categoria', 'category', 'tipo', 'type', 'classificacao'],
        dataDespesa: ['data', 'date', 'data despesa', 'expense date', 'data pagamento']
      };
      
      Object.keys(fieldMappingRules).forEach(mapField => {
        const possibleFields = fieldMappingRules[mapField];
        
        // Procura correspondências exatas ou parciais nos campos disponíveis
        const matchedField = fields.find(field => {
          const normalizedField = field.toLowerCase().trim();
          return possibleFields.some(possibleField => 
            normalizedField === possibleField || 
            normalizedField.includes(possibleField)
          );
        });
        
        if (matchedField) {
          autoMapping[mapField] = matchedField;
        }
      });
      
      setMapping(prevMapping => ({
        ...prevMapping,
        ...autoMapping
      }));
    }
  }, [fileData]);
  
  const handleMappingChange = (field, value) => {
    setMapping(prevMapping => ({
      ...prevMapping,
      [field]: value
    }));
  };
  
  const validateMapping = () => {
    // Campos obrigatórios
    const requiredFields = ['empresa', 'valorPago', 'orcamento', 'categoria'];
    
    const missingFields = requiredFields.filter(field => !mapping[field]);
    
    if (missingFields.length > 0) {
      setError(`Por favor, mapeie os campos obrigatórios: ${missingFields.join(', ')}`);
      return false;
    }
    
    // Verifica se há campos duplicados
    const selectedValues = Object.values(mapping).filter(Boolean);
    const uniqueValues = new Set(selectedValues);
    
    if (selectedValues.length !== uniqueValues.size) {
      setError('Não é possível mapear o mesmo campo de origem para múltiplos campos do sistema.');
      return false;
    }
    
    setError('');
    return true;
  };
  
  const handleContinue = () => {
    if (!validateMapping()) {
      return;
    }
    
    // Aplica o mapeamento aos dados
    const mappedData = fileData.map(item => {
      const mappedItem = {};
      
      Object.keys(mapping).forEach(field => {
        const sourceField = mapping[field];
        if (sourceField) {
          mappedItem[field] = item[sourceField];
        }
      });
      
      return mappedItem;
    });
    
    onMappingComplete(mappedData);
  };
  
  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };
  
  const renderMappingForm = () => {
    const fieldDefinitions = [
      { 
        id: 'empresa', 
        label: 'Empresa', 
        description: 'Nome da empresa relacionada à despesa', 
        required: true 
      },
      { 
        id: 'fornecedor', 
        label: 'Fornecedor', 
        description: 'Nome do fornecedor do serviço ou produto', 
        required: false 
      },
      { 
        id: 'observacao', 
        label: 'Observação', 
        description: 'Descrição ou detalhes da despesa', 
        required: false 
      },
      { 
        id: 'valorPago', 
        label: 'Valor Pago', 
        description: 'Valor monetário da despesa', 
        required: true 
      },
      { 
        id: 'orcamento', 
        label: 'Orçamento', 
        description: 'Departamento ou centro de custo', 
        required: true 
      },
      { 
        id: 'categoria', 
        label: 'Categoria', 
        description: 'Tipo ou classificação da despesa', 
        required: true 
      },
      { 
        id: 'dataDespesa', 
        label: 'Data da Despesa', 
        description: 'Data em que a despesa foi realizada', 
        required: false 
      }
    ];
    
    return (
      <div className="mapping-form">
        {fieldDefinitions.map(field => (
          <div key={field.id} className="mapping-row">
            <div>
              <div className="field-name">
                {field.label}
                {field.required && <span className="field-required">*</span>}
              </div>
              <div className="field-description">{field.description}</div>
            </div>
            <div>
              <select 
                className="field-select"
                value={mapping[field.id]}
                onChange={(e) => handleMappingChange(field.id, e.target.value)}
              >
                <option value="">Selecione um campo...</option>
                {availableFields.map((availableField, index) => (
                  <option key={index} value={availableField}>
                    {availableField}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  const renderPreview = () => {
    // Filtra apenas os campos mapeados para exibição
    const mappedFields = Object.entries(mapping)
      .filter(([_, sourceField]) => sourceField)
      .map(([targetField, sourceField]) => ({ 
        targetField, 
        sourceField 
      }));
    
    if (mappedFields.length === 0) {
      return null;
    }
    
    return (
      <div className="mapping-preview">
        <h3>Prévia do Mapeamento</h3>
        <div className="preview-table">
          <table>
            <thead>
              <tr>
                {mappedFields.map(({ targetField, sourceField }) => (
                  <th key={targetField}>
                    {targetField} ← {sourceField}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewData.map((item, rowIndex) => (
                <tr key={rowIndex}>
                  {mappedFields.map(({ targetField, sourceField }) => (
                    <td key={`${rowIndex}-${targetField}`}>
                      {item[sourceField]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  return (
    <div className="mapping-container">
      <div className="mapping-instructions">
        <h3>Mapeamento de Campos</h3>
        <p>
          Associe os campos da sua planilha aos campos do sistema. 
          Os campos marcados com * são obrigatórios.
        </p>
      </div>
      
      {error && <div className="mapping-error">{error}</div>}
      
      {renderMappingForm()}
      
      {renderPreview()}
      
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