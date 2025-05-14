// src/components/expenses/EditExpenseForm.jsx

import React, { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';
import expenseService from '../../services/expenseService';

/**
 * Componente para editar um lançamento de despesa
 * @param {Object} props - Propriedades do componente
 * @param {Object} props.expense - Dados da despesa a ser editada
 * @param {Function} props.onCancel - Função a ser chamada ao cancelar a edição
 * @param {Function} props.onSaveSuccess - Função a ser chamada após edição bem-sucedida
 * @param {Array} props.categories - Lista de categorias disponíveis
 * @param {Array} props.budgets - Lista de orçamentos disponíveis
 */
const EditExpenseForm = ({ 
  expense, 
  onCancel, 
  onSaveSuccess,
  categories = [], 
  budgets = []
}) => {
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [formData, setFormData] = useState({
    id: '',
    empresa: '',
    fornecedor: '',
    observacao: '',
    valorPago: '',
    categoria: '',
    orcamento: '',
    dataDespesa: ''
  });

  // Carregar dados iniciais quando o componente é montado
  useEffect(() => {
    if (expense) {
      setFormData({
        id: expense.id || '',
        empresa: expense.empresa || '',
        fornecedor: expense.fornecedor || '',
        observacao: expense.observacao || '',
        valorPago: expense.valorPago || '',
        categoria: expense.categoria || '',
        orcamento: expense.orcamento || '',
        dataDespesa: formatDateForInput(expense.dataDespesa || expense.createdAt || new Date())
      });
    }
  }, [expense]);

  // Atualiza o campo sendo editado
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Formatar data para input
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    return date.toISOString().split('T')[0]; // Formato YYYY-MM-DD
  };

  // Salvar as alterações
  const handleSave = async () => {
    // Validação básica
    if (!formData.empresa || !formData.valorPago || !formData.categoria || !formData.orcamento) {
      setSaveError('Preencha todos os campos obrigatórios (Empresa, Valor, Categoria e Orçamento)');
      return;
    }
    
    try {
      setSaving(true);
      setSaveError('');
      
      // Chama o serviço para atualizar a despesa
      const updatedExpense = await expenseService.updateExpense(formData);
      
      // Notifica o componente pai sobre o sucesso
      if (onSaveSuccess) {
        onSaveSuccess(updatedExpense);
      }
    } catch (err) {
      console.error('Erro ao salvar alterações:', err);
      setSaveError(`Erro ao salvar: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="edit-form">
      {saveError && <div className="edit-error">{saveError}</div>}
      
      <div className="edit-form-row">
        <div className="edit-form-group">
          <label>Empresa/Fornecedor</label>
          <input
            type="text"
            value={formData.empresa}
            onChange={(e) => handleChange('empresa', e.target.value)}
            placeholder="Nome da empresa"
          />
        </div>
        
        <div className="edit-form-group">
          <label>Fornecedor (opcional)</label>
          <input
            type="text"
            value={formData.fornecedor}
            onChange={(e) => handleChange('fornecedor', e.target.value)}
            placeholder="Fornecedor"
          />
        </div>
      </div>
      
      <div className="edit-form-row">
        <div className="edit-form-group">
          <label>Descrição/Observação</label>
          <textarea
            value={formData.observacao}
            onChange={(e) => handleChange('observacao', e.target.value)}
            placeholder="Descrição da despesa"
            rows={3}
          />
        </div>
      </div>
      
      <div className="edit-form-row">
        <div className="edit-form-group">
          <label>Data</label>
          <input
            type="date"
            value={formData.dataDespesa}
            onChange={(e) => handleChange('dataDespesa', e.target.value)}
          />
        </div>
        
        <div className="edit-form-group">
          <label>Valor Pago (R$)</label>
          <input
            type="number"
            value={formData.valorPago}
            onChange={(e) => handleChange('valorPago', e.target.value)}
            step="0.01"
            min="0"
          />
        </div>
      </div>
      
      <div className="edit-form-row">
        <div className="edit-form-group">
          <label>Categoria</label>
          <select
            value={formData.categoria}
            onChange={(e) => handleChange('categoria', e.target.value)}
          >
            <option value="">Selecione uma categoria</option>
            {categories.map((category, index) => (
              <option key={index} value={category}>{category}</option>
            ))}
          </select>
        </div>
        
        <div className="edit-form-group">
          <label>Orçamento</label>
          <select
            value={formData.orcamento}
            onChange={(e) => handleChange('orcamento', e.target.value)}
          >
            <option value="">Selecione um orçamento</option>
            {budgets.map((budget, index) => (
              <option key={index} value={budget}>{budget}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="edit-form-actions">
        <button 
          className="edit-cancel-button" 
          onClick={onCancel}
          disabled={saving}
        >
          <X size={16} /> Cancelar
        </button>
        <button 
          className="edit-save-button" 
          onClick={handleSave}
          disabled={saving}
        >
          <Save size={16} /> {saving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>
    </div>
  );
};

export default EditExpenseForm;