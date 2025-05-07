// src/services/importService.js

import * as XLSX from 'xlsx';
import Parse from 'parse/dist/parse.min.js';

/**
 * Lê um arquivo Excel ou CSV e retorna os dados em formato JSON
 * Adaptado para o formato específico das planilhas de despesas de marketing
 * @param {File} file - Objeto File contendo o arquivo Excel/CSV
 * @returns {Promise<Array>} - Promise resolvida com array de objetos representando as linhas do arquivo
 */
// Modificação para o arquivo src/services/importService.js

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
          
          // Para debug - exibe o conteúdo da primeira célula da coluna M
          console.log('Conteúdo da célula M7:', worksheet['M7']);
          
          // Converte para JSON com cabeçalhos automáticos (A, B, C, etc.)
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            raw: false,
            defval: '',
            header: 'A',
          });
          
          // Log para debug - mostra as primeiras linhas
          console.log('Primeiras linhas da planilha:', jsonData.slice(0, 10));
          
          // Modificação: Pega os dados a partir da linha 7 (índice 6) ou da linha 1 se houver menos de 7 linhas
          const startIndex = jsonData.length >= 7 ? 6 : 0;
          const dataRows = jsonData.slice(startIndex);
          
          // Log para debug - mostra as colunas da primeira linha
          if (dataRows.length > 0) {
            console.log('Colunas disponíveis na primeira linha:', Object.keys(dataRows[0]));
          }
          
          // Mapeia os dados conforme a especificação, mas verifica em várias colunas para o valor
          const formattedData = dataRows.map(row => {
            // Tentar encontrar o valor em várias colunas potenciais
            const valorPotencial = row['M'] || row['N'] || row['O'] || row['P'] || row['L'] || '';
            
            return {
              empresa: row['A'] || '',
              fornecedor: row['B'] || '',
              observacao: row['D'] || '',
              valorPago: valorPotencial, // Tenta várias colunas potenciais
              // O orçamento e categoria serão definidos durante a importação
              orcamento: 'MARKETING', // Valor padrão
              categoria: 'DESPESA GERAL' // Valor padrão
            };
          }).filter(row => {
            // Filtra linhas em branco ou sem dados relevantes
            return row.empresa || row.fornecedor || row.valorPago;
          });
          
          // Log para debug - mostra os dados formatados
          console.log('Dados formatados:', formattedData.slice(0, 5));
          
          // Verifica se há pelo menos um registro válido após a filtragem
          if (formattedData.length > 0) {
            resolve(formattedData);
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
 * Salva os dados de despesas no Parse Server
 * @param {Array} expenses - Array de objetos representando despesas a serem salvas
 * @returns {Promise<Object>} - Promise resolvida com informações sobre os dados salvos
 */
export const saveExpensesToParse = async (expenses) => {
  try {
    const Despesa = Parse.Object.extend('DespesasDetalhadas');
    
    const processedItems = expenses.map(expense => {
      const despesa = new Despesa();
      
      // Define os campos básicos da despesa
      despesa.set('empresa', expense.empresa);
      despesa.set('fornecedor', expense.fornecedor);
      despesa.set('observacao', expense.observacao);
      
      // Trata o valor pago, convertendo para número
      if (expense.valorPago) {
        let valorPago = expense.valorPago;
        
        // Se o valor for uma string, converte para número
        if (typeof valorPago === 'string') {
          // Remove caracteres não numéricos, exceto ponto e vírgula
          valorPago = valorPago.replace(/[^\d.,]/g, '');
          // Substitui vírgula por ponto para conversão numérica
          valorPago = valorPago.replace(',', '.');
          // Converte para número
          valorPago = parseFloat(valorPago);
        }
        
        if (!isNaN(valorPago)) {
          despesa.set('valorPago', valorPago);
        } else {
          despesa.set('valorPago', 0);
        }
      } else {
        despesa.set('valorPago', 0);
      }
      
      // Define o orçamento e a categoria padrão ou personalizada
      despesa.set('orcamento', expense.orcamento || 'MARKETING');
      despesa.set('categoria', expense.categoria || 'DESPESA GERAL');
      
      // Define o mês e ano
      if (expense.mes) {
        despesa.set('mes', expense.mes);
      }
      
      if (expense.ano) {
        despesa.set('ano', expense.ano);
      }
      
      // Define a data da despesa se disponível
      if (expense.dataDespesa) {
        let dataDespesa;
        if (expense.dataDespesa instanceof Date) {
          dataDespesa = expense.dataDespesa;
        } else {
          // Tenta converter string para data
          dataDespesa = new Date(expense.dataDespesa);
        }
        
        if (!isNaN(dataDespesa.getTime())) {
          despesa.set('dataDespesa', dataDespesa);
        }
      } else if (expense.mes && expense.ano) {
        // Se não houver data específica, usa o primeiro dia do mês
        const dataDespesa = new Date(expense.ano, expense.mes - 1, 1);
        despesa.set('dataDespesa', dataDespesa);
      }
      
      // Adiciona informações de auditoria
      despesa.set('createdBy', Parse.User.current());
      
      return despesa;
    });
    
    // Salva todas as despesas no servidor
    const savedItems = await Parse.Object.saveAll(processedItems);
    
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