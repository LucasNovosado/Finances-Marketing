// src/components/expenses/ExpenseDetailTable.jsx

import React, { useState, useEffect } from 'react';
import { Download, ChevronUp, ChevronDown, FileText, Calendar, DollarSign, Tag, Briefcase, ArrowUp, ArrowDown, Edit, Save, X } from 'lucide-react';
import './ExpenseDetailTable.css';
import expenseService from '../../services/expenseService';

const ExpenseDetailTable = ({ expenses, onExport }) => {
  const [sortConfig, setSortConfig] = useState({
    key: 'dataDespesa',
    direction: 'desc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [expandedRows, setExpandedRows] = useState({});
  const [editMode, setEditMode] = useState(null); // ID da linha sendo editada ou null
  const [editData, setEditData] = useState({}); // Dados sendo editados
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Buscar categorias e orçamentos disponíveis
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [categoriesData, budgetsData] = await Promise.all([
          expenseService.getAvailableCategories(),
          expenseService.getAvailableBudgets()
        ]);
        setCategories(categoriesData);
        setBudgets(budgetsData);
      } catch (error) {
        console.error('Erro ao carregar opções:', error);
      }
    };
    
    fetchOptions();
  }, []);

  // Ordenar dados
  useEffect(() => {
    const scrollToTop = () => {
      const tableBody = document.querySelector('.expense-table-body');
      if (tableBody) {
        tableBody.scrollTop = 0;
      }
    };
    
    scrollToTop();
  }, [currentPage, sortConfig]);

  // Solicitar ordenação
  const requestSort = (key) => {
    let direction = 'asc';
    
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    setSortConfig({ key, direction });
    // Resetar para a primeira página ao mudar a ordenação
    setCurrentPage(1);
  };

  // Obter a classe CSS para o cabeçalho da coluna ordenada
  const getSortClass = (key) => {
    if (sortConfig.key !== key) return '';
    return sortConfig.direction === 'asc' ? 'sort-asc' : 'sort-desc';
  };

  // Ordenar os dados
  const sortedData = [...expenses].sort((a, b) => {
    const key = sortConfig.key;
    
    // Tratar valores nulos ou indefinidos
    if (!a[key] && !b[key]) return 0;
    if (!a[key]) return sortConfig.direction === 'asc' ? -1 : 1;
    if (!b[key]) return sortConfig.direction === 'asc' ? 1 : -1;
    
    let valueA = a[key];
    let valueB = b[key];
    
    // Se forem datas, converter para objetos Date
    if (key === 'dataDespesa' || key === 'createdAt') {
      valueA = new Date(valueA);
      valueB = new Date(valueB);
    }
    
    // Comparação
    if (valueA < valueB) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (valueA > valueB) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // Paginação
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  
  // Expandir/colapsar linha
  const toggleRowExpand = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Iniciar edição de uma linha
  const startEdit = (expense) => {
    // Fecha quaisquer linhas expandidas
    setExpandedRows({});
    
    // Define os dados de edição iniciais
    setEditData({
      id: expense.id,
      empresa: expense.empresa || '',
      fornecedor: expense.fornecedor || '',
      observacao: expense.observacao || '',
      valorPago: expense.valorPago || '',
      categoria: expense.categoria || '',
      orcamento: expense.orcamento || '',
      dataDespesa: formatDateForInput(expense.dataDespesa || expense.createdAt)
    });
    
    // Ativa o modo de edição para essa linha
    setEditMode(expense.id);
  };

  // Cancelar edição
  const cancelEdit = () => {
    setEditMode(null);
    setEditData({});
    setSaveError('');
  };

  // Atualizar o campo sendo editado
  const handleEditChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Salvar as alterações
  const saveChanges = async () => {
    // Validação básica
    if (!editData.empresa || !editData.valorPago || !editData.categoria || !editData.orcamento) {
      setSaveError('Preencha todos os campos obrigatórios (Empresa, Valor, Categoria e Orçamento)');
      return;
    }
    
    try {
      setSaving(true);
      setSaveError('');
      
      // Aqui você chamaria o serviço para salvar as alterações
      // Por exemplo: await expenseService.updateExpense(editData);
      
      // Simular salvar (remover esta parte quando implementar a chamada real)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Atualizar a lista localmente (isso seria feito pela função que busca os dados novamente)
      // Para fins de demonstração, vamos simular a atualização da lista
      const updatedExpenses = expenses.map(exp => 
        exp.id === editData.id ? { ...exp, ...editData } : exp
      );
      
      // Como não temos acesso direto para atualizar 'expenses', você precisaria 
      // chamar uma função passada como prop ou recarregar os dados
      // Por exemplo: onUpdate(updatedExpenses);
      
      // Sair do modo de edição
      setEditMode(null);
      setEditData({});
      
      // Exibir alguma confirmação para o usuário (opcional)
      alert('Alterações salvas com sucesso!');
      
    } catch (error) {
      console.error('Erro ao salvar alterações:', error);
      setSaveError(`Erro ao salvar: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Formatar data para input
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    return date.toISOString().split('T')[0]; // Formato YYYY-MM-DD
  };

  // Formatar data para exibição
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  // Formatar valor monetário
  const formatCurrency = (value) => {
    if (value === undefined || value === null) return '-';
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Função para renderizar a seta de ordenação
  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <span className="sort-icon neutral"><ArrowUp size={12} /></span>;
    }
    
    return (
      <span className="sort-icon">
        {sortConfig.direction === 'asc' ? (
          <ArrowUp size={12} />
        ) : (
          <ArrowDown size={12} />
        )}
      </span>
    );
  };

  // Mudar de página
  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // Mudar itens por página
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  // Renderiza linha normal ou linha de edição
  const renderRow = (expense) => {
    // Se esta linha estiver em modo de edição, mostrar o formulário de edição
    if (editMode === expense.id) {
      return (
        <tr className="edit-row">
          <td colSpan="7">
            <div className="edit-form">
              {saveError && <div className="edit-error">{saveError}</div>}
              
              <div className="edit-form-row">
                <div className="edit-form-group">
                  <label>Empresa/Fornecedor</label>
                  <input
                    type="text"
                    value={editData.empresa}
                    onChange={(e) => handleEditChange('empresa', e.target.value)}
                    placeholder="Nome da empresa"
                  />
                </div>
                
                <div className="edit-form-group">
                  <label>Fornecedor (opcional)</label>
                  <input
                    type="text"
                    value={editData.fornecedor}
                    onChange={(e) => handleEditChange('fornecedor', e.target.value)}
                    placeholder="Fornecedor"
                  />
                </div>
              </div>
              
              <div className="edit-form-row">
                <div className="edit-form-group">
                  <label>Descrição/Observação</label>
                  <textarea
                    value={editData.observacao}
                    onChange={(e) => handleEditChange('observacao', e.target.value)}
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
                    value={editData.dataDespesa}
                    onChange={(e) => handleEditChange('dataDespesa', e.target.value)}
                  />
                </div>
                
                <div className="edit-form-group">
                  <label>Valor Pago (R$)</label>
                  <input
                    type="number"
                    value={editData.valorPago}
                    onChange={(e) => handleEditChange('valorPago', e.target.value)}
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
              
              <div className="edit-form-row">
                <div className="edit-form-group">
                  <label>Categoria</label>
                  <select
                    value={editData.categoria}
                    onChange={(e) => handleEditChange('categoria', e.target.value)}
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
                    value={editData.orcamento}
                    onChange={(e) => handleEditChange('orcamento', e.target.value)}
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
                  onClick={cancelEdit}
                  disabled={saving}
                >
                  <X size={16} /> Cancelar
                </button>
                <button 
                  className="edit-save-button" 
                  onClick={saveChanges}
                  disabled={saving}
                >
                  <Save size={16} /> {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </div>
          </td>
        </tr>
      );
    }
    
    // Caso contrário, mostrar a linha normal
    return (
      <tr className={expandedRows[expense.id] ? 'expanded-row' : ''}>
        <td className="expand-cell">
          <button
            className="expand-button"
            onClick={() => toggleRowExpand(expense.id)}
            aria-label={expandedRows[expense.id] ? 'Colapsar detalhes' : 'Expandir detalhes'}
          >
            {expandedRows[expense.id] ? (
              <ChevronUp size={16} />
            ) : (
              <ChevronDown size={16} />
            )}
          </button>
        </td>
        <td className="date-cell">
          {formatDate(expense.dataDespesa || expense.createdAt)}
        </td>
        <td className="company-cell">{expense.empresa || '-'}</td>
        <td className="description-cell">{expense.observacao || '-'}</td>
        <td className="category-cell">
          <span className="category-badge">{expense.categoria || '-'}</span>
        </td>
        <td className="budget-cell">
          <span className="budget-badge">{expense.orcamento || '-'}</span>
        </td>
        <td className="value-cell">{formatCurrency(expense.valorPago)}</td>
        <td className="actions-column">
          <button
            className="edit-button"
            onClick={() => startEdit(expense)}
            title="Editar lançamento"
          >
            <Edit size={16} />
          </button>
        </td>
      </tr>
    );
  };

  return (
    <div className="expense-detail-table-container">
      <div className="table-header">
        <div className="table-info">
          <h2>Despesas</h2>
          <span className="total-count">Total: {expenses.length} registros encontrados</span>
        </div>
        <div className="table-actions">
          <button className="export-button" onClick={() => onExport('csv')}>
            <Download size={16} />
            Exportar CSV
          </button>
          <button className="export-button" onClick={() => onExport('excel')}>
            <Download size={16} />
            Exportar Excel
          </button>
        </div>
      </div>

      <div className="expense-table-wrapper">
        <table className="expense-table">
          <thead>
            <tr>
              <th className="expand-column"></th>
              <th 
                className={`date-column ${getSortClass('dataDespesa')}`}
                onClick={() => requestSort('dataDespesa')}
              >
                <div className="th-content">
                  <Calendar size={16} />
                  <span>Data</span>
                  {renderSortIcon('dataDespesa')}
                </div>
              </th>
              <th 
                className={`company-column ${getSortClass('empresa')}`}
                onClick={() => requestSort('empresa')}
              >
                <div className="th-content">
                  <FileText size={16} />
                  <span>Empresa/Fornecedor</span>
                  {renderSortIcon('empresa')}
                </div>
              </th>
              <th className="description-column">
                <div className="th-content">
                  <span>Descrição</span>
                </div>
              </th>
              <th 
                className={`category-column ${getSortClass('categoria')}`}
                onClick={() => requestSort('categoria')}
              >
                <div className="th-content">
                  <Tag size={16} />
                  <span>Categoria</span>
                  {renderSortIcon('categoria')}
                </div>
              </th>
              <th 
                className={`budget-column ${getSortClass('orcamento')}`}
                onClick={() => requestSort('orcamento')}
              >
                <div className="th-content">
                  <Briefcase size={16} />
                  <span>Orçamento</span>
                  {renderSortIcon('orcamento')}
                </div>
              </th>
              <th 
                className={`value-column ${getSortClass('valorPago')}`}
                onClick={() => requestSort('valorPago')}
              >
                <div className="th-content">
                  <DollarSign size={16} />
                  <span>Valor</span>
                  {renderSortIcon('valorPago')}
                </div>
              </th>
              <th className="actions-column">Ações</th>
            </tr>
          </thead>
          <tbody className="expense-table-body">
            {currentItems.length === 0 ? (
              <tr className="no-data-row">
                <td colSpan="8" className="no-data-cell">
                  Nenhum registro encontrado com os filtros aplicados
                </td>
              </tr>
            ) : (
              currentItems.map((expense) => (
                <React.Fragment key={expense.id}>
                  {renderRow(expense)}
                  {expandedRows[expense.id] && !editMode && (
                    <tr className="details-row">
                      <td colSpan="8">
                        <div className="expense-details">
                          <div className="details-section">
                            <h4>Detalhes completos</h4>
                            <div className="details-grid">
                              <div className="detail-item">
                                <span className="detail-label">ID:</span>
                                <span className="detail-value">{expense.id}</span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">Empresa:</span>
                                <span className="detail-value">{expense.empresa || '-'}</span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">Fornecedor:</span>
                                <span className="detail-value">{expense.fornecedor || '-'}</span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">Data:</span>
                                <span className="detail-value">
                                  {formatDate(expense.dataDespesa || expense.createdAt)}
                                </span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">Categoria:</span>
                                <span className="detail-value">{expense.categoria || '-'}</span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">Orçamento:</span>
                                <span className="detail-value">{expense.orcamento || '-'}</span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">Valor:</span>
                                <span className="detail-value">{formatCurrency(expense.valorPago)}</span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">Cadastrado em:</span>
                                <span className="detail-value">{formatDate(expense.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="details-section">
                            <h4>Descrição/Observações</h4>
                            <div className="detail-description">
                              {expense.observacao || 'Nenhuma descrição disponível.'}
                            </div>
                          </div>
                          <div className="details-section">
                            <button
                              className="edit-detail-button"
                              onClick={() => startEdit(expense)}
                            >
                              <Edit size={16} /> Editar este lançamento
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <div className="items-per-page">
          <span>Mostrar</span>
          <select
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
          >
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span>por página</span>
        </div>
        
        <div className="pagination-info">
          Mostrando {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, sortedData.length)} de {sortedData.length} registros
        </div>
        
        <div className="pagination-controls">
          <button
            className="pagination-button"
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
          >
            &laquo;
          </button>
          <button
            className="pagination-button"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            &lsaquo;
          </button>
          
          {/* Paginação dinâmica */}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNumber;
            if (totalPages <= 5) {
              pageNumber = i + 1;
            } else if (currentPage <= 3) {
              pageNumber = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNumber = totalPages - 4 + i;
            } else {
              pageNumber = currentPage - 2 + i;
            }
            
            return (
              <button
                key={pageNumber}
                className={`pagination-button ${currentPage === pageNumber ? 'active' : ''}`}
                onClick={() => handlePageChange(pageNumber)}
              >
                {pageNumber}
              </button>
            );
          })}
          
          <button
            className="pagination-button"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            &rsaquo;
          </button>
          <button
            className="pagination-button"
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
          >
            &raquo;
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpenseDetailTable;