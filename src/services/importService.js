// src/services/importService.js

import * as XLSX from 'xlsx';
import Parse from 'parse/dist/parse.min.js';

/**
 * Lê um arquivo Excel ou CSV e retorna os dados em formato JSON
 * Adaptado para o formato específico das planilhas de despesas de marketing
 * @param {File} file - Objeto File contendo o arquivo Excel/CSV
 * @returns {Promise<Array>} - Promise resolvida com array de objetos representando as linhas do arquivo
 */
export const readExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, {
          type: 'array',
          cellDates: true,
          dateNF: 'yyyy-mm-dd',
        });
        
        // Pega a primeira planilha
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Converte para JSON com cabeçalhos automáticos (A, B, C, etc.)
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          raw: false,
          defval: '',
          header: 'A',
        });
        
        // Verifica se temos dados suficientes (pelo menos 7 linhas, já que os dados começam na linha 7)
        if (jsonData.length >= 7) {
          // Pega apenas os dados a partir da linha 7 (índice 6 no array)
          const dataRows = jsonData.slice(6);
          
          // Mapeia os dados conforme a especificação:
          // COLUNA A: Empresa
          // COLUNA B: Fornecedor
          // COLUNA D: Observação
          // COLUNA M: Valor Pago
          const formattedData = dataRows.map(row => {
            return {
              empresa: row['A'] || '',
              fornecedor: row['B'] || '',
              observacao: row['D'] || '',
              valorPago: row['M'] || '',
              // Colunas adicionais para mapeamento posterior
              orcamento: '', // Será preenchido no mapeamento manual
              categoria: '', // Será preenchido no mapeamento manual
            };
          });
          
          resolve(formattedData);
        } else {
          reject(new Error('O arquivo não contém dados suficientes. Verifique se é o arquivo correto.'));
        }
      } catch (error) {
        console.error('Erro ao processar o arquivo:', error);
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      console.error('Erro ao ler o arquivo:', error);
      reject(error);
    };
    
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Salva os dados de despesas no Parse Server
 * @param {Array} expenses - Array de objetos representando despesas a serem salvas
 * @param {Object} fieldMapping - Mapeamento de campos do arquivo para campos do Parse
 * @returns {Promise<Object>} - Promise resolvida com informações sobre os dados salvos
 */
export const saveExpensesToParse = async (expenses, fieldMapping) => {
  try {
    const Despesa = Parse.Object.extend('Despesa');
    const savePromises = [];
    
    const processedItems = expenses.map(expense => {
      const despesa = new Despesa();
      
      // Mapeia os campos do arquivo para os campos do Parse
      Object.keys(fieldMapping).forEach(parseField => {
        const excelField = fieldMapping[parseField];
        if (excelField && expense[excelField] !== undefined) {
          // Tratamento especial para os tipos de dados
          if (parseField === 'valorPago' && typeof expense[excelField] === 'string') {
            // Converte string de valor para número
            const numericValue = parseFloat(expense[excelField].replace(/[^\d.,]/g, '').replace(',', '.'));
            despesa.set(parseField, isNaN(numericValue) ? 0 : numericValue);
          } else if (parseField === 'dataDespesa' && expense[excelField]) {
            // Trata campo de data
            let dateValue;
            if (expense[excelField] instanceof Date) {
              dateValue = expense[excelField];
            } else {
              // Tenta converter string de data para objeto Date
              dateValue = new Date(expense[excelField]);
            }
            
            if (!isNaN(dateValue.getTime())) {
              despesa.set(parseField, dateValue);
            }
          } else {
            // Campo de texto normal
            despesa.set(parseField, expense[excelField]);
          }
        }
      });
      
      // Adiciona informações de auditoria
      despesa.set('createdBy', Parse.User.current());
      
      return despesa;
    });
    
    // Salva todas as despesas no servidor
    const savedItems = await Parse.Object.saveAll(processedItems);
    
    return {
      success: true,
      totalSaved: savedItems.length,
      items: savedItems
    };
  } catch (error) {
    console.error('Erro ao salvar despesas:', error);
    throw error;
  }
};

/**
 * Obtém as categorias disponíveis no sistema
 * @returns {Promise<Array>} - Promise resolvida com array de categorias
 */
export const fetchCategories = async () => {
  try {
    const Categoria = Parse.Object.extend('Categoria');
    const query = new Parse.Query(Categoria);
    query.ascending('nome');
    
    const categories = await query.find();
    return categories.map(category => ({
      id: category.id,
      nome: category.get('nome'),
      departamento: category.get('departamento')
    }));
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    throw error;
  }
};

/**
 * Obtém os departamentos disponíveis no sistema
 * @returns {Promise<Array>} - Promise resolvida com array de departamentos
 */
export const fetchDepartments = async () => {
  try {
    const Departamento = Parse.Object.extend('Departamento');
    const query = new Parse.Query(Departamento);
    query.ascending('nome');
    
    const departments = await query.find();
    return departments.map(department => ({
      id: department.id,
      nome: department.get('nome'),
      percentual: department.get('percentual')
    }));
  } catch (error) {
    console.error('Erro ao buscar departamentos:', error);
    throw error;
  }
};