// src/pages/ImportExpensePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { useImportExpense } from '../contexts/ImportExpenseContext';
import './ImportExpensePage.css';

const ImportExpensePage = () => {
  const navigate = useNavigate();
  const {
    selectedDepartment,
    selectedMonth,
    selectedYear,
    departments,
    categories,
    loading,
    error,
    importData,
    importedExpenses,
    importSummary,
    setSelectedDepartment,
    setSelectedMonth,
    setSelectedYear,
    fetchDepartments,
    fetchCategories,
    processExcelData,
    saveImportedData,
    updateExpenseCategory,
    updateExpenseField,
    clearImportData
  } = useImportExpense();

  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [editingRow, setEditingRow] = useState(null);
  const [editField, setEditField] = useState(null);
  const [editValue, setEditValue] = useState('');

  // Meses para seleção
  const months = [
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

  // Anos para seleção (5 anos para trás e 2 para frente)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 8 }, (_, i) => currentYear - 5 + i);

  // Buscar departamentos e categorias ao carregar a página
  useEffect(() => {
    fetchDepartments();
    fetchCategories();
  }, []);

  // Função para lidar com a seleção de arquivo
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);

    if (selectedFile) {
      const reader = new FileReader();
      
      reader.onload = (evt) => {
        try {
          const data = evt.target.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Converter para JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
          setPreviewData(jsonData);
        } catch (error) {
          console.error("Erro ao processar planilha:", error);
          setPreviewData(null);
        }
      };
      
      reader.readAsBinaryString(selectedFile);
    } else {
      setPreviewData(null);
    }
  };

  // Processar dados da planilha
  const handleProcessData = () => {
    if (!selectedDepartment) {
      alert("Selecione um departamento antes de continuar.");
      return;
    }
    
    if (!previewData) {
      alert("Selecione um arquivo para importar.");
      return;
    }
    
    processExcelData(previewData);
  };

  // Salvar dados processados
  const handleSaveData = () => {
    saveImportedData();
  };

  // Iniciar edição de campo
  const handleStartEdit = (rowId, field, value) => {
    setEditingRow(rowId);
    setEditField(field);
    setEditValue(value);
  };

  // Salvar edição de campo
  const handleSaveEdit = async (rowId) => {
    if (editingRow && editField) {
      // Verifica se o campo é valorPago para fazer a conversão para número
      const value = editField === 'valorPago' ? parseFloat(editValue) : editValue;
      
      await updateExpenseField(rowId, editField, value);
      setEditingRow(null);
      setEditField(null);
      setEditValue('');
    }
  };

  // Cancelar edição
  const handleCancelEdit = () => {
    setEditingRow(null);
    setEditField(null);
    setEditValue('');
  };

  // Atualizar categoria
  const handleCategoryChange = (rowId, categoryId) => {
    updateExpenseCategory(rowId, categoryId);
  };

  // Voltar para o dashboard
  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="import-expense-container">
      <header className="import-header">
        <h1>Importação de Despesas</h1>
        <button 
          className="btn-secondary"
          onClick={handleBackToDashboard}
        >
          Voltar para Dashboard
        </button>
      </header>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <section className="import-form">
        <h2>Configurações de Importação</h2>
        
        <div className="config-grid">
          <div className="config-item">
            <label htmlFor="department">Departamento:</label>
            <select
              id="department"
              value={selectedDepartment?.id || ''}
              onChange={(e) => {
                const deptId = e.target.value;
                const selected = departments.find(d => d.id === deptId) || null;
                setSelectedDepartment(selected);
              }}
              disabled={loading}
            >
              <option value="">Selecione um departamento</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>
                  {dept.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="config-item">
            <label htmlFor="month">Mês:</label>
            <select
              id="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              disabled={loading}
            >
              {months.map(month => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>

          <div className="config-item">
            <label htmlFor="year">Ano:</label>
            <select
              id="year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              disabled={loading}
            >
              {years.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="file-upload">
          <label htmlFor="file" className="file-label">
            Selecionar Planilha
            <input
              type="file"
              id="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              disabled={loading}
              className="file-input"
            />
          </label>
          <span className="file-name">
            {file ? file.name : 'Nenhum arquivo selecionado'}
          </span>
        </div>

        {previewData && !importData.length && (
          <div className="preview-actions">
            <button 
              className="btn-primary" 
              onClick={handleProcessData}
              disabled={loading || !selectedDepartment}
            >
              Processar Dados
            </button>
          </div>
        )}
      </section>

      {/* Preview dos dados da planilha */}
      {previewData && previewData.length > 0 && !importData.length && (
        <section className="data-preview">
          <h2>Preview da Planilha</h2>
          <div className="table-container">
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
                {previewData.slice(6, 15).map((row, index) => (
                  <tr key={index}>
                    <td>{row[0]}</td>
                    <td>{row[1]}</td>
                    <td>{row[3]}</td>
                    <td className="value-cell">{row[12]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {previewData.length > 15 && (
              <div className="preview-note">
                Mostrando 10 primeiras linhas de um total de {previewData.length - 6} linhas.
              </div>
            )}
          </div>
        </section>
      )}

      {/* Dados processados */}
      {importData.length > 0 && !importSummary && (
        <section className="processed-data">
          <h2>Dados Processados</h2>
          <div className="data-summary">
            <p>
              <strong>Departamento:</strong> {selectedDepartment?.nome}
            </p>
            <p>
              <strong>Período:</strong> {months.find(m => m.value === selectedMonth)?.label} de {selectedYear}
            </p>
            <p>
              <strong>Total de registros:</strong> {importData.length}
            </p>
          </div>
          
          <div className="table-container">
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
                {importData.map((item, index) => (
                  <tr key={index}>
                    <td>{item.empresa}</td>
                    <td>{item.fornecedor}</td>
                    <td>{item.observacao}</td>
                    <td className="value-cell">
                      {new Intl.NumberFormat('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL' 
                      }).format(item.valorPago)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="action-buttons">
            <button 
              className="btn-secondary" 
              onClick={clearImportData}
              disabled={loading}
            >
              Cancelar
            </button>
            <button 
              className="btn-primary" 
              onClick={handleSaveData}
              disabled={loading}
            >
              {loading ? 'Importando...' : 'Confirmar Importação'}
            </button>
          </div>
        </section>
      )}

      {/* Resultados da importação */}
      {importSummary && (
        <section className="import-results">
          <h2>Resultado da Importação</h2>
          
          <div className="import-summary">
            <div className="summary-item">
              <span className="summary-label">Total de registros:</span>
              <span className="summary-value">{importSummary.total}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Processados:</span>
              <span className="summary-value">{importSummary.processed}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Importados com sucesso:</span>
              <span className="summary-value success">{importSummary.saved}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Erros:</span>
              <span className={`summary-value ${importSummary.errors > 0 ? 'error' : ''}`}>
                {importSummary.errors}
              </span>
            </div>
          </div>
          
          {importedExpenses.length > 0 && (
            <div className="edit-expenses">
              <h3>Editar Despesas Importadas</h3>
              <p className="edit-note">
                Você precisa associar cada despesa a uma categoria. 
                Você também pode editar outros campos clicando neles.
              </p>
              
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Empresa</th>
                      <th>Fornecedor</th>
                      <th>Observação</th>
                      <th>Valor Pago</th>
                      <th>Categoria</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importedExpenses.map((expense) => (
                      <tr key={expense.id} className={expense.saved ? '' : 'error-row'}>
                        <td 
                          onClick={() => handleStartEdit(expense.id, 'empresa', expense.empresa)}
                          className={editingRow === expense.id && editField === 'empresa' ? 'editing' : ''}
                        >
                          {editingRow === expense.id && editField === 'empresa' ? (
                            <div className="edit-cell">
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                autoFocus
                              />
                              <div className="edit-actions">
                                <button onClick={() => handleSaveEdit(expense.id)}>✓</button>
                                <button onClick={handleCancelEdit}>✕</button>
                              </div>
                            </div>
                          ) : (
                            expense.empresa
                          )}
                        </td>
                        <td 
                          onClick={() => handleStartEdit(expense.id, 'fornecedor', expense.fornecedor)}
                          className={editingRow === expense.id && editField === 'fornecedor' ? 'editing' : ''}
                        >
                          {editingRow === expense.id && editField === 'fornecedor' ? (
                            <div className="edit-cell">
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                autoFocus
                              />
                              <div className="edit-actions">
                                <button onClick={() => handleSaveEdit(expense.id)}>✓</button>
                                <button onClick={handleCancelEdit}>✕</button>
                              </div>
                            </div>
                          ) : (
                            expense.fornecedor
                          )}
                        </td>
                        <td 
                          onClick={() => handleStartEdit(expense.id, 'observacao', expense.observacao)}
                          className={editingRow === expense.id && editField === 'observacao' ? 'editing' : ''}
                        >
                          {editingRow === expense.id && editField === 'observacao' ? (
                            <div className="edit-cell">
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                autoFocus
                              />
                              <div className="edit-actions">
                                <button onClick={() => handleSaveEdit(expense.id)}>✓</button>
                                <button onClick={handleCancelEdit}>✕</button>
                              </div>
                            </div>
                          ) : (
                            expense.observacao
                          )}
                        </td>
                        <td 
                          onClick={() => handleStartEdit(expense.id, 'valorPago', expense.valorPago)}
                          className={`value-cell ${editingRow === expense.id && editField === 'valorPago' ? 'editing' : ''}`}
                        >
                          {editingRow === expense.id && editField === 'valorPago' ? (
                            <div className="edit-cell">
                              <input
                                type="number"
                                step="0.01"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                autoFocus
                              />
                              <div className="edit-actions">
                                <button onClick={() => handleSaveEdit(expense.id)}>✓</button>
                                <button onClick={handleCancelEdit}>✕</button>
                              </div>
                            </div>
                          ) : (
                            new Intl.NumberFormat('pt-BR', { 
                              style: 'currency', 
                              currency: 'BRL' 
                            }).format(expense.valorPago)
                          )}
                        </td>
                        <td className="category-cell">
                          <select
                            value={expense.categoriaId || ''}
                            onChange={(e) => handleCategoryChange(expense.id, e.target.value)}
                            className={!expense.categoriaId ? 'not-selected' : ''}
                          >
                            <option value="">Selecione uma categoria</option>
                            {categories.map(cat => (
                              <option key={cat.id} value={cat.id}>
                                {cat.nome}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          <div className="action-buttons">
            <button 
              className="btn-primary" 
              onClick={clearImportData}
              disabled={loading}
            >
              Nova Importação
            </button>
            <button 
              className="btn-secondary" 
              onClick={handleBackToDashboard}
            >
              Voltar para Dashboard
            </button>
          </div>
        </section>
      )}
    </div>
  );
};

export default ImportExpensePage;