// src/contexts/ImportExpenseContext.js
import React, { createContext, useState, useContext } from 'react';
import { Parse } from '../services/parseService';

// Criando o contexto
const ImportExpenseContext = createContext();

// Hook personalizado para utilizar o contexto
export const useImportExpense = () => useContext(ImportExpenseContext);

// Provider do contexto
export const ImportExpenseProvider = ({ children }) => {
  // Estados para gerenciar a importação
  const [importData, setImportData] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // Mês atual
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear()); // Ano atual
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [importedExpenses, setImportedExpenses] = useState([]);
  const [importSummary, setImportSummary] = useState(null);

  // Função para buscar departamentos do Parse Server
  const fetchDepartments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const Departamento = Parse.Object.extend("Departamento");
      const query = new Parse.Query(Departamento);
      const results = await query.find();
      
      const departmentList = results.map(dept => ({
        id: dept.id,
        nome: dept.get('nome'),
        percentual: dept.get('percentual'),
        cor: dept.get('cor')
      }));
      
      setDepartments(departmentList);
    } catch (error) {
      console.error("Erro ao buscar departamentos:", error);
      setError("Não foi possível carregar os departamentos. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Função para buscar categorias do Parse Server
  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const Categoria = Parse.Object.extend("Categoria");
      const query = new Parse.Query(Categoria);
      const results = await query.find();
      
      const categoryList = results.map(cat => ({
        id: cat.id,
        nome: cat.get('nome'),
        departamento: cat.get('departamento'),
        cor: cat.get('cor')
      }));
      
      setCategories(categoryList);
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
      setError("Não foi possível carregar as categorias. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Função para processar a planilha importada
  const processExcelData = (data) => {
    if (!data || !data.length || data.length < 7) {
      setError("A planilha não contém dados suficientes. Verifique o formato.");
      return;
    }

    // Extrair dados a partir da linha 7
    const validRows = data.slice(6).filter(row => 
      row[0] && // Empresa
      row[1] && // Fornecedor
      row[12] !== undefined // Valor Pago (coluna M)
    );

    // Mapear para o formato da classe Despesa
    const mappedData = validRows.map((row, index) => ({
      id: `temp_${index}`,
      empresa: row[0]?.toString().trim() || '',
      fornecedor: row[1]?.toString().trim() || '',
      observacao: row[3]?.toString().trim() || '',
      valorPago: parseFloat(row[12]) || 0,
      nomeDepartamento: selectedDepartment?.nome || '',
      departamentoId: selectedDepartment?.id || null,
      categoria: null,
      categoriaId: null,
      mes: selectedMonth,
      ano: selectedYear,
      // Outros campos serão preenchidos após salvar
      comprovante: null,
      status: 'Pendente'
    }));

    setImportData(mappedData);
    return mappedData;
  };

  // Função para salvar os dados importados no Parse Server
  const saveImportedData = async () => {
    if (!selectedDepartment) {
      setError("Selecione um departamento antes de importar os dados.");
      return;
    }

    if (!importData.length) {
      setError("Não há dados para importar.");
      return;
    }

    setLoading(true);
    setError(null);
    
    const Despesa = Parse.Object.extend("Despesa");
    const importedItems = [];
    const errors = [];
    let itemsProcessed = 0;
    let itemsSaved = 0;
    
    try {
      const departamentoPointer = {
        __type: 'Pointer',
        className: 'Departamento',
        objectId: selectedDepartment.id
      };

      for (const item of importData) {
        const despesa = new Despesa();
        
        despesa.set("empresa", item.empresa);
        despesa.set("fornecedor", item.fornecedor);
        despesa.set("observacao", item.observacao);
        despesa.set("valorPago", item.valorPago);
        despesa.set("nomeDepartamento", selectedDepartment.nome);
        despesa.set("departamento", departamentoPointer);
        despesa.set("mes", selectedMonth);
        despesa.set("ano", selectedYear);
        despesa.set("data", new Date(selectedYear, selectedMonth - 1, 1)); // Primeiro dia do mês
        
        // Associar categoria se estiver definida
        if (item.categoriaId) {
          const categoriaPointer = {
            __type: 'Pointer',
            className: 'Categoria',
            objectId: item.categoriaId
          };
          despesa.set("categoria", categoriaPointer);
        }
        
        // Associar usuário atual
        despesa.set("createdBy", Parse.User.current());
        
        try {
          const savedDespesa = await despesa.save();
          importedItems.push({
            ...item,
            id: savedDespesa.id,
            saved: true
          });
          itemsSaved++;
        } catch (err) {
          console.error(`Erro ao salvar despesa: ${err.message}`);
          errors.push({
            item,
            error: err.message
          });
          importedItems.push({
            ...item,
            saved: false,
            error: err.message
          });
        }
        
        itemsProcessed++;
      }

      setImportedExpenses(importedItems);
      setImportSummary({
        total: importData.length,
        processed: itemsProcessed,
        saved: itemsSaved,
        errors: errors.length,
        details: errors
      });
      
      if (errors.length === 0) {
        setImportData([]);
      }
    } catch (error) {
      console.error("Erro durante a importação:", error);
      setError(`Ocorreu um erro durante a importação: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Função para atualizar categoria para uma despesa
  const updateExpenseCategory = async (expenseId, categoryId) => {
    if (!expenseId || !categoryId) return;
    
    setLoading(true);
    try {
      const Despesa = Parse.Object.extend("Despesa");
      const query = new Parse.Query(Despesa);
      const despesa = await query.get(expenseId);
      
      const Categoria = Parse.Object.extend("Categoria");
      const categoria = new Categoria();
      categoria.id = categoryId;
      
      despesa.set("categoria", categoria);
      await despesa.save();
      
      // Atualizar a lista local de despesas importadas
      const updatedExpenses = importedExpenses.map(exp => {
        if (exp.id === expenseId) {
          const selectedCategory = categories.find(cat => cat.id === categoryId);
          return {
            ...exp,
            categoriaId: categoryId,
            categoria: selectedCategory,
            categoriaName: selectedCategory?.nome
          };
        }
        return exp;
      });
      
      setImportedExpenses(updatedExpenses);
    } catch (error) {
      console.error("Erro ao atualizar categoria:", error);
      setError(`Não foi possível atualizar a categoria: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Função para editar um campo da despesa
  const updateExpenseField = async (expenseId, field, value) => {
    if (!expenseId || !field) return;
    
    setLoading(true);
    try {
      const Despesa = Parse.Object.extend("Despesa");
      const query = new Parse.Query(Despesa);
      const despesa = await query.get(expenseId);
      
      despesa.set(field, value);
      await despesa.save();
      
      // Atualizar a lista local de despesas importadas
      const updatedExpenses = importedExpenses.map(exp => {
        if (exp.id === expenseId) {
          return {
            ...exp,
            [field]: value
          };
        }
        return exp;
      });
      
      setImportedExpenses(updatedExpenses);
    } catch (error) {
      console.error(`Erro ao atualizar campo ${field}:`, error);
      setError(`Não foi possível atualizar o campo: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Função para limpar dados da importação
  const clearImportData = () => {
    setImportData([]);
    setImportedExpenses([]);
    setImportSummary(null);
    setError(null);
  };

  // Valores exportados pelo contexto
  const value = {
    importData,
    selectedDepartment,
    selectedMonth,
    selectedYear,
    departments,
    categories,
    loading,
    error,
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
  };

  return (
    <ImportExpenseContext.Provider value={value}>
      {children}
    </ImportExpenseContext.Provider>
  );
};

export default ImportExpenseContext;