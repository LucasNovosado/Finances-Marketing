// src/components/expenses/AddExpensePopup.jsx

import React, { useState, useEffect } from 'react';
import { X, Save, DollarSign, Calendar, Tag, Briefcase, FileText, User } from 'lucide-react';
import Parse from 'parse/dist/parse.min.js';
import './AddExpensePopup.css';

const AddExpensePopup = ({ isOpen, onClose, onSave, categories, budgets }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Estado do formulário
  const [formData, setFormData] = useState({
    empresa: '',
    fornecedor: '',
    observacao: '',
    valorPago: '',
    categoria: '',
    orcamento: '',
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear()
  });

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

  // Anos disponíveis (últimos 3 anos + próximos 2 anos)
  const anoAtual = new Date().getFullYear();
  const anos = Array.from({length: 5}, (_, i) => anoAtual - 2 + i);

  // Reseta o formulário quando o popup abre
  useEffect(() => {
    if (isOpen) {
      setFormData({
        empresa: '',
        fornecedor: '',
        observacao: '',
        valorPago: '',
        categoria: '',
        orcamento: '',
        mes: new Date().getMonth() + 1,
        ano: new Date().getFullYear()
      });
      setError('');
    }
  }, [isOpen]);

  // Função para fechar o popup
  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  // Função para atualizar campos do formulário
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpa erro ao começar a digitar
    if (error) {
      setError('');
    }
  };

  // Função para formatar valor monetário em tempo real
  const formatCurrencyInput = (value) => {
    // Remove tudo que não for dígito
    let numericValue = value.replace(/\D/g, '');
    
    // Se não houver valor, retorna vazio
    if (!numericValue) return '';
    
    // Converte para número e divide por 100 para ter centavos
    let numValue = parseInt(numericValue) / 100;
    
    // Formata como moeda brasileira
    return numValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Função para extrair valor numérico do campo formatado
  const extractNumericValue = (formattedValue) => {
    if (!formattedValue) return '';
    
    // Remove formatação e converte para formato decimal
    const numericValue = formattedValue.replace(/\./g, '').replace(',', '.');
    return numericValue;
  };

  // Função para criar data brasileira no meio do mês
  const createBrazilianMidMonthDate = (mes, ano) => {
    const data = new Date();
    data.setFullYear(ano);
    data.setMonth(mes - 1);
    data.setDate(15);
    data.setHours(12, 0, 0, 0);
    return data;
  };

  // Função para validar o formulário
  const validateForm = () => {
    if (!formData.empresa.trim()) {
      return 'Por favor, informe a empresa.';
    }
    
    if (!formData.valorPago || formData.valorPago === '0,00') {
      return 'Por favor, informe um valor válido maior que zero.';
    }
    
    // Extrai valor numérico para validação
    const numericValue = extractNumericValue(formData.valorPago);
    const valor = parseFloat(numericValue);
    
    if (isNaN(valor) || valor <= 0) {
      return 'Por favor, informe um valor válido maior que zero.';
    }
    
    if (!formData.categoria) {
      return 'Por favor, selecione uma categoria.';
    }
    
    if (!formData.orcamento) {
      return 'Por favor, selecione um orçamento.';
    }
    
    return null;
  };

  // Função para salvar a despesa
  const handleSave = async () => {
    try {
      // Validar formulário
      const validationError = validateForm();
      if (validationError) {
        setError(validationError);
        return;
      }

      setLoading(true);
      setError('');

      // Criar objeto da despesa no Parse
      const Despesa = Parse.Object.extend('DespesasDetalhadas');
      const despesa = new Despesa();

      // Definir campos básicos
      despesa.set('empresa', formData.empresa.trim());
      despesa.set('fornecedor', formData.fornecedor.trim());
      despesa.set('observacao', formData.observacao.trim());
      despesa.set('categoria', formData.categoria);
      despesa.set('orcamento', formData.orcamento);
      despesa.set('mes', parseInt(formData.mes));
      despesa.set('ano', parseInt(formData.ano));

      // Converter e definir valor pago
      const numericValueString = extractNumericValue(formData.valorPago);
      const valorPago = parseFloat(numericValueString);
      despesa.set('valorPago', valorPago);

      // Criar data brasileira no meio do mês
      const dataDespesa = createBrazilianMidMonthDate(formData.mes, formData.ano);
      despesa.set('dataDespesa', dataDespesa);

      // Adicionar usuário criador
      const currentUser = Parse.User.current();
      if (currentUser) {
        despesa.set('createdBy', currentUser);
      }

      // Salvar no Parse
      const savedDespesa = await despesa.save();

      console.log('Despesa salva:', savedDespesa.id);

      // Chamar callback de sucesso
      if (onSave) {
        const despesaData = {
          id: savedDespesa.id,
          empresa: savedDespesa.get('empresa'),
          fornecedor: savedDespesa.get('fornecedor'),
          observacao: savedDespesa.get('observacao'),
          valorPago: savedDespesa.get('valorPago'),
          categoria: savedDespesa.get('categoria'),
          orcamento: savedDespesa.get('orcamento'),
          mes: savedDespesa.get('mes'),
          ano: savedDespesa.get('ano'),
          dataDespesa: savedDespesa.get('dataDespesa'),
          createdAt: savedDespesa.get('createdAt')
        };
        
        onSave(despesaData);
      }

      // Fechar popup
      handleClose();

    } catch (err) {
      console.error('Erro ao salvar despesa:', err);
      setError(`Erro ao salvar despesa: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Função para prevenir fechamento ao clicar no conteúdo
  const handleContentClick = (e) => {
    e.stopPropagation();
  };

  // Não renderizar se não estiver aberto
  if (!isOpen) return null;

  return (
    <div className="popup-overlay" onClick={handleClose}>
      <div className="popup-container" onClick={handleContentClick}>
        <div className="popup-header">
          <h2>Adicionar Nova Despesa</h2>
          <button 
            className="close-button" 
            onClick={handleClose}
            disabled={loading}
            title="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="popup-content">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Informações sobre o período */}
          <div className="date-info-card">
            <div className="date-info-title">
              <Calendar size={16} />
              Período da Despesa
            </div>
            <div className="date-filters">
              <div className="date-filter-group">
                <label>Mês:</label>
                <select
                  value={formData.mes}
                  onChange={(e) => handleInputChange('mes', parseInt(e.target.value))}
                  disabled={loading}
                >
                  {meses.map(mes => (
                    <option key={mes.value} value={mes.value}>
                      {mes.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="date-filter-group">
                <label>Ano:</label>
                <select
                  value={formData.ano}
                  onChange={(e) => handleInputChange('ano', parseInt(e.target.value))}
                  disabled={loading}
                >
                  {anos.map(ano => (
                    <option key={ano} value={ano}>{ano}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Formulário principal */}
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">
                <User size={16} />
                Empresa <span className="required-indicator">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Nome da empresa"
                value={formData.empresa}
                onChange={(e) => handleInputChange('empresa', e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <User size={16} />
                Fornecedor
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Nome do fornecedor"
                value={formData.fornecedor}
                onChange={(e) => handleInputChange('fornecedor', e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <Tag size={16} />
                Categoria <span className="required-indicator">*</span>
              </label>
              <select
                className="form-select"
                value={formData.categoria}
                onChange={(e) => handleInputChange('categoria', e.target.value)}
                disabled={loading}
              >
                <option value="">Selecione uma categoria</option>
                {categories.map((category, index) => (
                  <option key={index} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                <Briefcase size={16} />
                Orçamento <span className="required-indicator">*</span>
              </label>
              <select
                className="form-select"
                value={formData.orcamento}
                onChange={(e) => handleInputChange('orcamento', e.target.value)}
                disabled={loading}
              >
                <option value="">Selecione um orçamento</option>
                {budgets.map((budget, index) => (
                  <option key={index} value={budget}>
                    {budget}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                <DollarSign size={16} />
                Valor Pago <span className="required-indicator">*</span>
              </label>
              <div className="currency-input-wrapper">
                <span className="currency-prefix"></span>
                <input
                  type="text"
                  className="form-input currency-input"
                  placeholder="0,00"
                  value={formData.valorPago}
                  onChange={(e) => {
                    const formatted = formatCurrencyInput(e.target.value);
                    handleInputChange('valorPago', formatted);
                  }}
                  disabled={loading}
                />
              </div>
              <div className="form-help-text">
                Digite apenas números (ex: 150050 = R$ 1.500,50)
              </div>
            </div>

            <div className="form-group full-width">
              <label className="form-label">
                <FileText size={16} />
                Descrição/Observação
              </label>
              <textarea
                className="form-textarea"
                placeholder="Descreva os detalhes da despesa..."
                rows={4}
                value={formData.observacao}
                onChange={(e) => handleInputChange('observacao', e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <div className="popup-actions">
          <button 
            className="cancel-button" 
            onClick={handleClose}
            disabled={loading}
          >
            <X size={16} />
            Cancelar
          </button>
          <button 
            className="save-button" 
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="loading-spinner" />
                Salvando...
              </>
            ) : (
              <>
                <Save size={16} />
                Salvar Despesa
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddExpensePopup;