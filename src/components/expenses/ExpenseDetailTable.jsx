// src/components/expenses/ExpenseDetailTable.jsx

import React, { useState, useEffect } from 'react';
import { Download, ChevronUp, ChevronDown, FileText, Calendar, DollarSign, Tag, Briefcase, ArrowUp, ArrowDown, Edit, Save, X, FileSpreadsheet } from 'lucide-react';
import excelExportService from '../../services/excelExportService';
import './ExpenseDetailTable.css';
import expenseService from '../../services/expenseService';

const ExpenseDetailTable = ({ expenses, filters = {}, onExport }) => {
  const [sortConfig, setSortConfig] = useState({
    key: 'dataDespesa',
    direction: 'desc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [expandedRows, setExpandedRows] = useState({});
  const [editMode, setEditMode] = useState(null);
  const [editData, setEditData] = useState({});
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [exporting, setExporting] = useState(false);

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

  // Função para exportar para Excel completo
  const handleExportExcel = async () => {
    try {
      setExporting(true);
      
      // Preparar informações sobre filtros para incluir no relatório
      const filterInfo = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        startMonth: filters.startMonth, // Incluir mês/ano do filtro
        startYear: filters.startYear,
        endMonth: filters.endMonth,
        endYear: filters.endYear,
        category: filters.category,
        budget: filters.budget,
        searchTerm: filters.searchTerm,
        minAmount: filters.minAmount,
        maxAmount: filters.maxAmount
      };

      // Determinar nome do arquivo baseado nos filtros
      let fileName = 'despesas_detalhadas';
      
      if (filters.startMonth && filters.startYear) {
        const nomesMeses = [
          'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
          'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        const nomeMes = nomesMeses[filters.startMonth - 1];
        fileName += `_${nomeMes}_${filters.startYear}`;
      } else if (filters.startDate && filters.endDate) {
        const startStr = filters.startDate.toLocaleDateString('pt-BR').replace(/\//g, '-');
        const endStr = filters.endDate.toLocaleDateString('pt-BR').replace(/\//g, '-');
        fileName += `_${startStr}_a_${endStr}`;
      } else {
        fileName += `_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}`;
      }

      if (filters.category) {
        fileName += `_${filters.category.replace(/\s+/g, '_')}`;
      }

      if (filters.budget) {
        fileName += `_${filters.budget.replace(/\s+/g, '_')}`;
      }

      // Exportar usando o serviço
      await excelExportService.exportExpensesToExcel(expenses, {
        fileName,
        includeFilters: true,
        filterInfo
      });

      // Feedback visual de sucesso
      showExportSuccess();
      
    } catch (error) {
      console.error('Erro na exportação:', error);
      showExportError(error.message);
    } finally {
      setExporting(false);
    }
  };

  // Função para exportar apenas resumo
  const handleExportResumo = async () => {
    try {
      setExporting(true);
      
      const filterInfo = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        startMonth: filters.startMonth, // Incluir mês/ano do filtro
        startYear: filters.startYear,
        endMonth: filters.endMonth,
        endYear: filters.endYear,
        category: filters.category,
        budget: filters.budget
      };

      let fileName = 'resumo_despesas';
      if (filters.startMonth && filters.startYear) {
        const nomesMeses = [
          'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
          'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        const nomeMes = nomesMeses[filters.startMonth - 1];
        fileName += `_${nomeMes}_${filters.startYear}`;
      } else if (filters.startDate && filters.endDate) {
        const startStr = filters.startDate.toLocaleDateString('pt-BR').replace(/\//g, '-');
        const endStr = filters.endDate.toLocaleDateString('pt-BR').replace(/\//g, '-');
        fileName += `_${startStr}_a_${endStr}`;
      } else {
        fileName += `_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}`;
      }

      await excelExportService.exportResumoToExcel(expenses, {
        fileName,
        filterInfo
      });

      showExportSuccess();
      
    } catch (error) {
      console.error('Erro na exportação do resumo:', error);
      showExportError(error.message);
    } finally {
      setExporting(false);
    }
  };

  // Função para exportar CSV (alternativa leve)
  const handleExportCSV = async () => {
    try {
      setExporting(true);
      
      let fileName = 'despesas_csv';
      if (filters.startMonth && filters.startYear) {
        const nomesMeses = [
          'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
          'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        const nomeMes = nomesMeses[filters.startMonth - 1];
        fileName += `_${nomeMes}_${filters.startYear}`;
      } else if (filters.startDate && filters.endDate) {
        const startStr = filters.startDate.toLocaleDateString('pt-BR').replace(/\//g, '-');
        const endStr = filters.endDate.toLocaleDateString('pt-BR').replace(/\//g, '-');
        fileName += `_${startStr}_a_${endStr}`;
      } else {
        fileName += `_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}`;
      }

      await excelExportService.exportToCSV(expenses, { fileName });
      showExportSuccess();
      
    } catch (error) {
      console.error('Erro na exportação CSV:', error);
      showExportError(error.message);
    } finally {
      setExporting(false);
    }
  };

  // Feedback visual para sucesso na exportação
  const showExportSuccess = () => {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #28a745;
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 10000;
      font-weight: 500;
    `;
    notification.textContent = 'Arquivo exportado com sucesso!';
    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  };

  // Feedback visual para erro na exportação
  const showExportError = (message) => {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #dc3545;
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 10000;
      font-weight: 500;
      max-width: 300px;
    `;
    notification.textContent = `Erro na exportação: ${message}`;
    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  };

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
    
    if (!a[key] && !b[key]) return 0;
    if (!a[key]) return sortConfig.direction === 'asc' ? -1 : 1;
    if (!b[key]) return sortConfig.direction === 'asc' ? 1 : -1;
    
    let valueA = a[key];
    let valueB = b[key];
    
    if (key === 'dataDespesa' || key === 'createdAt') {
      valueA = new Date(valueA);
      valueB = new Date(valueB);
    }
    
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
    setExpandedRows({});
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
    if (!editData.empresa || !editData.valorPago || !editData.categoria || !editData.orcamento) {
      setSaveError('Preencha todos os campos obrigatórios (Empresa, Valor, Categoria e Orçamento)');
      return;
    }
    
    try {
      setSaving(true);
      setSaveError('');
      
      // Simular salvamento - substitua por: await expenseService.updateExpense(editData);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setEditMode(null);
      setEditData({});
      
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
    return date.toISOString().split('T')[0];
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
    if (editMode === expense.id) {
      return (
        <tr className="edit-row" key={expense.id}>
          <td colSpan="8">
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
    
    return (
      <tr className={expandedRows[expense.id] ? 'expanded-row' : ''} key={expense.id}>
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
          <div className="export-dropdown">
            <button 
              className="export-button primary-export"
              onClick={handleExportExcel}
              disabled={exporting || expenses.length === 0}
              title="Exportar planilha Excel completa com 2 abas: Resumo e Detalhes"
            >
              <FileSpreadsheet size={16} />
              <span>{exporting ? 'Exportando...' : 'Exportar Excel Completo'}</span>
            </button>
            
            <button 
              className="export-button secondary-export"
              onClick={handleExportResumo}
              disabled={exporting || expenses.length === 0}
              title="Exportar apenas resumo executivo"
            >
              <FileText size={16} />
              <span>Exportar Resumo</span>
            </button>
            
            <button 
              className="export-button secondary-export"
              onClick={handleExportCSV}
              disabled={exporting || expenses.length === 0}
              title="Exportar arquivo CSV para uso em outras planilhas"
            >
              <Download size={16} />
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>
      </div>

      {expenses.length === 0 ? (
        <div className="no-data-container">
          <p>Nenhuma despesa encontrada com os filtros aplicados.</p>
        </div>
      ) : (
        <>
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
                        <tr className="details-row" key={`${expense.id}-details`}>
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
        </>
      )}
    </div>
  );
};

export default ExpenseDetailTable;