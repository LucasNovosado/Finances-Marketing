// src/services/importService.js - VERSÃO COM CORREÇÃO DE FUSO HORÁRIO

import * as XLSX from 'xlsx';
import Parse from 'parse/dist/parse.min.js';

/**
 * Cria uma data no meio do mês (dia 15) no fuso horário do Brasil
 * @param {number} mes - Mês (1-12)
 * @param {number} ano - Ano
 * @returns {Date} - Data no dia 15 do mês às 12:00 no horário de Brasília
 */
const createBrazilianMidMonthDate = (mes, ano) => {
  // Criar data no dia 15 do mês às 12:00 (meio-dia) 
  // Usar horário local do Brasil (GMT-3)
  const data = new Date();
  
  // Definir ano, mês e dia
  data.setFullYear(ano);
  data.setMonth(mes - 1); // JavaScript usa mês baseado em 0
  data.setDate(15); // Dia 15 do mês
  
  // Definir horário para meio-dia (12:00)
  data.setHours(12);
  data.setMinutes(0);
  data.setSeconds(0);
  data.setMilliseconds(0);
  
  console.log(`Data criada para ${mes}/${ano}:`, data.toISOString(), 'Local:', data.toLocaleString('pt-BR'));
  
  return data;
};

/**
 * Lê um arquivo Excel ou CSV e retorna os dados em formato JSON
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
          sheetStubs: true,
          raw: false
        });
        
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        console.log('Range da planilha:', worksheet['!ref']);
        
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        const totalRows = range.e.r + 1;
        
        console.log(`Total de linhas na planilha: ${totalRows}`);
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          raw: false,
          defval: '',
          header: 'A',
          range: 0,
          blankrows: true
        });
        
        console.log(`Linhas convertidas para JSON: ${jsonData.length}`);
        
        const startIndex = 6; // Linha 7 na planilha
        const dataRows = jsonData.slice(startIndex);
        
        console.log(`Processando ${dataRows.length} linhas a partir da linha ${startIndex + 1}`);
        
        const formattedData = dataRows.map((row, index) => {
          const actualRowNumber = startIndex + index + 1;
          
          const valorPotencial = row['M'] || row['N'] || row['O'] || row['P'] || row['L'] || '';
          
          const formattedRow = {
            empresa: (row['A'] || '').toString().trim(),
            fornecedor: (row['B'] || '').toString().trim(),
            observacao: (row['D'] || '').toString().trim(),
            valorPago: valorPotencial.toString().trim(),
            orcamento: 'MARKETING',
            categoria: 'DESPESA GERAL',
            _originalRowNumber: actualRowNumber
          };
          
          return formattedRow;
        });
        
        const validData = formattedData.filter((row, index) => {
          const hasAnyData = row.empresa || row.fornecedor || row.valorPago || row.observacao;
          
          if (!hasAnyData) {
            console.log(`Removendo linha ${row._originalRowNumber} - completamente vazia`);
            return false;
          }
          
          return true;
        });
        
        console.log(`Dados após filtragem: ${validData.length} linhas válidas`);
        console.log('Resumo da importação:');
        console.log(`- Total de linhas na planilha: ${totalRows}`);
        console.log(`- Linhas processadas (a partir da linha 7): ${dataRows.length}`);
        console.log(`- Linhas válidas após filtragem: ${validData.length}`);
        
        if (validData.length > 0) {
          const cleanData = validData.map(row => {
            const { _originalRowNumber, ...cleanRow } = row;
            return cleanRow;
          });
          
          resolve(cleanData);
        } else {
          reject(new Error('Nenhum dado válido encontrado no arquivo. Verifique se o formato está correto.'));
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
 * Salva os dados de despesas no Parse Server com data corrigida para o fuso horário brasileiro
 * @param {Array} expenses - Array de objetos representando despesas a serem salvas
 * @returns {Promise<Object>} - Promise resolvida com informações sobre os dados salvos
 */
export const saveExpensesToParse = async (expenses) => {
  try {
    console.log(`Iniciando salvamento de ${expenses.length} despesas`);
    
    const Despesa = Parse.Object.extend('DespesasDetalhadas');
    
    const processedItems = expenses.map((expense, index) => {
      const despesa = new Despesa();
      
      // Define os campos básicos da despesa
      despesa.set('empresa', expense.empresa || '');
      despesa.set('fornecedor', expense.fornecedor || '');
      despesa.set('observacao', expense.observacao || '');
      
      // Trata o valor pago, convertendo para número
      if (expense.valorPago) {
        let valorPago = expense.valorPago;
        
        if (typeof valorPago === 'string') {
          valorPago = valorPago.replace(/[^\d.,]/g, '');
          valorPago = valorPago.replace(',', '.');
          valorPago = parseFloat(valorPago);
        }
        
        if (!isNaN(valorPago) && valorPago > 0) {
          despesa.set('valorPago', valorPago);
        } else {
          despesa.set('valorPago', 0);
        }
      } else {
        despesa.set('valorPago', 0);
      }
      
      // Define o orçamento e a categoria
      despesa.set('orcamento', expense.orcamento || 'MARKETING');
      despesa.set('categoria', expense.categoria || 'DESPESA GERAL');
      
      // Define o mês e ano
      if (expense.mes) {
        despesa.set('mes', expense.mes);
      }
      
      if (expense.ano) {
        despesa.set('ano', expense.ano);
      }
      
      // CORREÇÃO PRINCIPAL: Define a data sempre no meio do mês no horário brasileiro
      if (expense.mes && expense.ano) {
        const dataDespesaBrasil = createBrazilianMidMonthDate(expense.mes, expense.ano);
        despesa.set('dataDespesa', dataDespesaBrasil);
        
        console.log(`Despesa ${index + 1} - Data definida:`, {
          mes: expense.mes,
          ano: expense.ano,
          dataISO: dataDespesaBrasil.toISOString(),
          dataLocal: dataDespesaBrasil.toLocaleString('pt-BR', { 
            timeZone: 'America/Sao_Paulo',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })
        });
      } else if (expense.dataDespesa) {
        // Se houver uma data específica fornecida, usar ela mas ajustar para o meio do dia
        let dataDespesa;
        if (expense.dataDespesa instanceof Date) {
          dataDespesa = new Date(expense.dataDespesa);
        } else {
          dataDespesa = new Date(expense.dataDespesa);
        }
        
        if (!isNaN(dataDespesa.getTime())) {
          // Ajustar para meio-dia para evitar problemas de fuso horário
          dataDespesa.setHours(12, 0, 0, 0);
          despesa.set('dataDespesa', dataDespesa);
        }
      }
      
      // Adiciona informações de auditoria
      const currentUser = Parse.User.current();
      if (currentUser) {
        despesa.set('createdBy', currentUser);
      }
      
      console.log(`Processando despesa ${index + 1}:`, {
        empresa: expense.empresa,
        valor: despesa.get('valorPago'),
        orcamento: despesa.get('orcamento'),
        dataDespesa: despesa.get('dataDespesa')?.toISOString()
      });
      
      return despesa;
    });
    
    console.log(`Salvando ${processedItems.length} itens no banco...`);
    
    // Salva todas as despesas no servidor
    const savedItems = await Parse.Object.saveAll(processedItems);
    
    console.log(`Salvamento concluído. ${savedItems.length} itens salvos com sucesso.`);
    
    // Log das datas salvas para verificação
    savedItems.slice(0, 3).forEach((item, index) => {
      console.log(`Item salvo ${index + 1}:`, {
        id: item.id,
        dataDespesa: item.get('dataDespesa')?.toISOString(),
        mes: item.get('mes'),
        ano: item.get('ano')
      });
    });
    
    return {
      success: true,
      totalItems: expenses.length,
      totalSaved: savedItems.length,
      errors: expenses.length - savedItems.length,
      items: savedItems
    };
  } catch (error) {
    console.error('Erro ao salvar despesas:', error);
    throw error;
  }
};