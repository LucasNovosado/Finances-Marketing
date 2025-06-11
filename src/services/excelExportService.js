// src/services/excelExportService.js

import * as XLSX from 'xlsx';
import faturamentoService from './faturamentoService';

/**
 * Serviço especializado para exportação de dados para Excel
 * com formatação elegante e tratamento de erros robusto
 */
const excelExportService = {
  /**
   * Exporta dados de despesas para Excel com duas abas formatadas
   * @param {Array} expenses - Array de despesas para exportar
   * @param {Object} options - Opções de exportação
   * @returns {Promise<boolean>} - Promise resolvida com sucesso/erro
   */
  exportExpensesToExcel: async (expenses, options = {}) => {
    try {
      console.log('🚀 Iniciando exportação Excel...', { 
        totalRegistros: expenses?.length || 0,
        options 
      });

      // Validações iniciais
      if (!expenses) {
        throw new Error('Dados de despesas não fornecidos');
      }

      if (!Array.isArray(expenses)) {
        throw new Error('Os dados devem ser um array');
      }

      if (expenses.length === 0) {
        throw new Error('Nenhuma despesa encontrada para exportar');
      }

      // Verificar se XLSX está disponível
      if (!XLSX || !XLSX.utils) {
        throw new Error('Biblioteca XLSX não está disponível. Execute: npm install xlsx');
      }

      const {
        fileName = `despesas_${new Date().toISOString().split('T')[0]}`,
        includeFilters = false,
        filterInfo = {}
      } = options;

      console.log('📊 Criando workbook...');

      // Criar workbook
      const workbook = XLSX.utils.book_new();

      // Criar primeira aba - Resumo Geral
      console.log('📋 Gerando aba de resumo...');
      const resumoSheet = await excelExportService.createResumoSheet(expenses, filterInfo);
      XLSX.utils.book_append_sheet(workbook, resumoSheet, 'Resumo Geral');

      // Criar segunda aba - Despesas Detalhadas
      console.log('📝 Gerando aba de detalhes...');
      const detalhesSheet = excelExportService.createDetalhesSheet(expenses);
      XLSX.utils.book_append_sheet(workbook, detalhesSheet, 'Despesas Detalhadas');

      // Gerar e baixar arquivo
      console.log('💾 Salvando arquivo...', `${fileName}.xlsx`);
      XLSX.writeFile(workbook, `${fileName}.xlsx`);

      console.log('✅ Exportação Excel concluída com sucesso!');
      return true;

    } catch (error) {
      console.error('❌ Erro na exportação Excel:', error);
      throw new Error(`Falha na exportação: ${error.message}`);
    }
  },

  /**
   * Cria a planilha de resumo geral com totais por categoria e orçamento
   * @param {Array} expenses - Array de despesas
   * @param {Object} filterInfo - Informações sobre filtros aplicados
   * @returns {Object} - Worksheet do Excel
   */
  createResumoSheet: async (expenses, filterInfo) => {
    try {
      const data = [];
      
      // Obter o mês/ano do filtro ou da primeira despesa
      let mesReferencia = null;
      let anoReferencia = null;
      
      if (filterInfo.startMonth && filterInfo.startYear) {
        mesReferencia = filterInfo.startMonth;
        anoReferencia = filterInfo.startYear;
      } else if (expenses.length > 0) {
        // Usar a data da primeira despesa como referência
        const primeiraData = new Date(expenses[0].dataDespesa || expenses[0].createdAt);
        mesReferencia = primeiraData.getMonth() + 1;
        anoReferencia = primeiraData.getFullYear();
      }

      // Obter nome do mês
      const nomesMeses = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ];
      const nomeMes = mesReferencia ? nomesMeses[mesReferencia - 1] : 'Período Selecionado';
      
      // Cabeçalho principal
      data.push([`DESPESAS DO MÊS: ${nomeMes.toUpperCase()}`]);
      data.push(['']); // Linha em branco

      // Valor total geral das despesas
      const valorTotalDespesas = expenses.reduce((sum, expense) => {
        const valor = Number(expense.valorPago);
        return sum + (isNaN(valor) ? 0 : valor);
      }, 0);
      
      data.push(['Valor Total das Despesas:', valorTotalDespesas]);
      data.push(['']); // Linha em branco

      // Buscar dados de faturamento se temos o mês e ano
      let dadosFaturamento = null;
      if (mesReferencia && anoReferencia) {
        try {
          // Usar a mesma lógica do FinancialSummary
          dadosFaturamento = await faturamentoService.getFaturamentoByMonthYear(mesReferencia, anoReferencia);
          console.log('Dados de faturamento obtidos:', dadosFaturamento);
        } catch (error) {
          console.warn('Erro ao buscar dados de faturamento:', error);
        }
      }

      // Adicionar informações de faturamento
      data.push(['INFORMAÇÕES DE FATURAMENTO']);
      data.push(['']); // Linha em branco
      
      // Usar a mesma estrutura do FinancialSummary: totalComSucata e totalSemSucata
      const faturamentoComSucata = dadosFaturamento?.totalComSucata || 0;
      const faturamentoSemSucata = dadosFaturamento?.totalSemSucata || 0;
      
      // Faturamento com sucata
      data.push(['Faturamento com Sucata:', faturamentoComSucata]);
      
      // Faturamento sem sucata
      data.push(['Faturamento sem Sucata:', faturamentoSemSucata]);
      
      data.push(['']); // Linha em branco
      
      // Percentuais utilizados
      data.push(['PERCENTUAL UTILIZADO']);
      
      // Calcular percentual em relação ao faturamento com sucata (mesma lógica do FinancialSummary)
      const percentualComSucata = faturamentoComSucata > 0 
        ? (valorTotalDespesas / faturamentoComSucata * 100) 
        : 0;
      
      // Calcular percentual em relação ao faturamento sem sucata
      const percentualSemSucata = faturamentoSemSucata > 0 
        ? (valorTotalDespesas / faturamentoSemSucata * 100) 
        : 0;
      
      data.push(['% em relação ao Faturamento COM Sucata:', `${percentualComSucata.toFixed(2)}%`]);
      data.push(['% em relação ao Faturamento SEM Sucata:', `${percentualSemSucata.toFixed(2)}%`]);
      
      data.push(['']); // Linha em branco

      // Informações de filtros (se aplicáveis)
      if (filterInfo && Object.keys(filterInfo).length > 0) {
        let hasFilters = false;
        
        if (filterInfo.startDate || filterInfo.endDate || 
            filterInfo.category || filterInfo.budget || 
            filterInfo.searchTerm) {
          hasFilters = true;
        }

        if (hasFilters) {
          data.push(['FILTROS APLICADOS']);
          
          if (filterInfo.startDate) {
            data.push(['Data inicial:', filterInfo.startDate.toLocaleDateString('pt-BR')]);
          }
          if (filterInfo.endDate) {
            data.push(['Data final:', filterInfo.endDate.toLocaleDateString('pt-BR')]);
          }
          if (filterInfo.category) {
            data.push(['Categoria:', filterInfo.category]);
          }
          if (filterInfo.budget) {
            data.push(['Orçamento:', filterInfo.budget]);
          }
          if (filterInfo.searchTerm) {
            data.push(['Termo de busca:', filterInfo.searchTerm]);
          }
          
          data.push(['']); // Linha em branco
        }
      }

      // Resumo por categoria
      data.push(['RESUMO POR CATEGORIA']);
      data.push(['Categoria', 'Valor Total']);
      
      const resumoPorCategoria = excelExportService.groupByField(expenses, 'categoria');
      const categoriasOrdenadas = Object.entries(resumoPorCategoria)
        .sort((a, b) => b[1].total - a[1].total);

      categoriasOrdenadas.forEach(([categoria, dados]) => {
        data.push([
          categoria || 'Sem Categoria',
          dados.total
        ]);
      });

      data.push(['']); // Linha em branco
      data.push(['TOTAL CATEGORIAS', valorTotalDespesas]);
      data.push(['']); // Linha em branco

      // Resumo por orçamento
      data.push(['RESUMO POR ORÇAMENTO']);
      data.push(['Orçamento', 'Valor Total']);
      
      const resumoPorOrcamento = excelExportService.groupByField(expenses, 'orcamento');
      const orcamentosOrdenados = Object.entries(resumoPorOrcamento)
        .sort((a, b) => b[1].total - a[1].total);

      orcamentosOrdenados.forEach(([orcamento, dados]) => {
        data.push([
          orcamento || 'Sem Orçamento',
          dados.total
        ]);
      });

      data.push(['']); // Linha em branco
      data.push(['TOTAL ORÇAMENTOS', valorTotalDespesas]);

      // Criar worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(data);

      // Aplicar formatação básica
      excelExportService.formatResumoSheet(worksheet, data.length);

      return worksheet;

    } catch (error) {
      console.error('Erro ao criar aba de resumo:', error);
      throw new Error(`Erro na criação do resumo: ${error.message}`);
    }
  },

  /**
   * Cria a planilha de despesas detalhadas
   * @param {Array} expenses - Array de despesas
   * @returns {Object} - Worksheet do Excel
   */
  createDetalhesSheet: (expenses) => {
    try {
      const data = [];

      // Cabeçalho
      data.push(['DESPESAS DETALHADAS']);
      data.push(['']); // Linha em branco
      data.push(['Data', 'Empresa/Fornecedor', 'Descrição', 'Categoria', 'Orçamento', 'Valor']);

      // Dados das despesas ordenados por data (mais recentes primeiro)
      const expensesOrdenadas = [...expenses].sort((a, b) => {
        const dateA = new Date(a.dataDespesa || a.createdAt || new Date());
        const dateB = new Date(b.dataDespesa || b.createdAt || new Date());
        return dateB - dateA;
      });

      expensesOrdenadas.forEach(expense => {
        try {
          const dataExpense = new Date(expense.dataDespesa || expense.createdAt || new Date());
          const dataFormatada = isNaN(dataExpense.getTime()) ? '-' : dataExpense.toLocaleDateString('pt-BR');
          const valor = Number(expense.valorPago) || 0;
          
          data.push([
            dataFormatada,
            expense.empresa || '-',
            expense.observacao || '-',
            expense.categoria || '-',
            expense.orcamento || '-',
            valor
          ]);
        } catch (itemError) {
          console.warn('Erro ao processar item de despesa:', itemError, expense);
          // Adiciona linha com dados básicos mesmo com erro
          data.push([
            '-',
            expense.empresa || '-',
            expense.observacao || '-',
            expense.categoria || '-',
            expense.orcamento || '-',
            Number(expense.valorPago) || 0
          ]);
        }
      });

      // Linha de total
      const valorTotal = expenses.reduce((sum, expense) => {
        const valor = Number(expense.valorPago);
        return sum + (isNaN(valor) ? 0 : valor);
      }, 0);
      
      data.push(['']); // Linha em branco
      data.push(['', '', '', '', 'TOTAL:', valorTotal]);

      // Criar worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(data);

      // Aplicar formatação básica
      excelExportService.formatDetalhesSheet(worksheet, data.length, expenses.length);

      return worksheet;

    } catch (error) {
      console.error('Erro ao criar aba de detalhes:', error);
      throw new Error(`Erro na criação dos detalhes: ${error.message}`);
    }
  },

  /**
   * Agrupa despesas por campo específico
   * @param {Array} expenses - Array de despesas
   * @param {String} field - Campo para agrupar
   * @returns {Object} - Objeto com totais agrupados
   */
  groupByField: (expenses, field) => {
    try {
      return expenses.reduce((acc, expense) => {
        const key = expense[field] || `Sem ${field.charAt(0).toUpperCase() + field.slice(1)}`;
        
        if (!acc[key]) {
          acc[key] = {
            total: 0,
            count: 0
          };
        }
        
        const valor = Number(expense.valorPago);
        acc[key].total += isNaN(valor) ? 0 : valor;
        acc[key].count += 1;
        
        return acc;
      }, {});
    } catch (error) {
      console.error('Erro ao agrupar por campo:', error);
      return {};
    }
  },

  /**
   * Aplica formatação básica à planilha de resumo
   * @param {Object} worksheet - Worksheet do Excel
   * @param {Number} dataLength - Número de linhas de dados
   */
  formatResumoSheet: (worksheet, dataLength) => {
    try {
      // Definir largura das colunas
      worksheet['!cols'] = [
        { wch: 35 }, // Coluna A - Descrições (mais larga)
        { wch: 15 }, // Coluna B - Quantidades
        { wch: 18 }, // Coluna C - Valores
        { wch: 12 }  // Coluna D - Extra
      ];

      // Adicionar formato de número para valores monetários
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:D1');
      
      for (let row = range.s.r; row <= range.e.r; row++) {
        // Formatar valores na coluna B (índice 1) e C (índice 2)
        const cellB = XLSX.utils.encode_cell({ r: row, c: 1 });
        const cellC = XLSX.utils.encode_cell({ r: row, c: 2 });
        
        if (worksheet[cellB] && typeof worksheet[cellB].v === 'number') {
          worksheet[cellB].z = '_("R$"* #,##0.00_);_("R$"* \(#,##0.00\);_("R$"* "-"??_);_(@_)';
        }
        
        if (worksheet[cellC] && typeof worksheet[cellC].v === 'number') {
          worksheet[cellC].z = '_("R$"* #,##0.00_);_("R$"* \(#,##0.00\);_("R$"* "-"??_);_(@_)';
        }
      }

    } catch (error) {
      console.warn('Erro ao aplicar formatação do resumo:', error);
    }
  },

  /**
   * Aplica formatação básica à planilha de detalhes
   * @param {Object} worksheet - Worksheet do Excel
   * @param {Number} dataLength - Número de linhas de dados
   * @param {Number} expenseCount - Número de despesas
   */
  formatDetalhesSheet: (worksheet, dataLength, expenseCount) => {
    try {
      // Definir largura das colunas
      worksheet['!cols'] = [
        { wch: 12 }, // Data
        { wch: 25 }, // Empresa
        { wch: 40 }, // Descrição
        { wch: 20 }, // Categoria
        { wch: 20 }, // Orçamento
        { wch: 15 }  // Valor
      ];

      // Aplicar formatação de valores monetários na coluna F (índice 5)
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:F1');
      
      for (let row = range.s.r + 3; row <= range.e.r; row++) { // Começar após cabeçalhos
        const cellF = XLSX.utils.encode_cell({ r: row, c: 5 });
        if (worksheet[cellF] && typeof worksheet[cellF].v === 'number') {
          worksheet[cellF].z = '_("R$"* #,##0.00_);_("R$"* \(#,##0.00\);_("R$"* "-"??_);_(@_)';
        }
      }

      // Definir área de impressão
      if (expenseCount > 0) {
        worksheet['!autofilter'] = { ref: `A2:F${2 + expenseCount}` };
      }

    } catch (error) {
      console.warn('Erro ao aplicar formatação dos detalhes:', error);
    }
  },

  /**
   * Exporta apenas o resumo para Excel (versão simplificada)
   * @param {Array} expenses - Array de despesas
   * @param {Object} options - Opções de exportação
   */
  exportResumoToExcel: async (expenses, options = {}) => {
    try {
      console.log('📊 Iniciando exportação de resumo...');

      if (!expenses || expenses.length === 0) {
        throw new Error('Nenhuma despesa encontrada para exportar resumo');
      }

      const { 
        fileName = `resumo_despesas_${new Date().toISOString().split('T')[0]}`,
        filterInfo = {}
      } = options;
      
      const workbook = XLSX.utils.book_new();
      const resumoSheet = await excelExportService.createResumoSheet(expenses, filterInfo);
      
      XLSX.utils.book_append_sheet(workbook, resumoSheet, 'Resumo');
      XLSX.writeFile(workbook, `${fileName}.xlsx`);
      
      console.log('✅ Exportação de resumo concluída');
      return true;

    } catch (error) {
      console.error('❌ Erro na exportação de resumo:', error);
      throw new Error(`Falha na exportação do resumo: ${error.message}`);
    }
  },

  /**
   * Exporta para CSV (alternativa mais leve)
   * @param {Array} expenses - Array de despesas
   * @param {Object} options - Opções de exportação
   */
  exportToCSV: async (expenses, options = {}) => {
    try {
      console.log('📄 Iniciando exportação CSV...');

      if (!expenses || expenses.length === 0) {
        throw new Error('Nenhuma despesa encontrada para exportar CSV');
      }

      const { fileName = `despesas_${new Date().toISOString().split('T')[0]}` } = options;
      
      // Preparar dados para CSV
      const csvData = expenses.map(expense => {
        try {
          const data = new Date(expense.dataDespesa || expense.createdAt || new Date());
          const dataFormatada = isNaN(data.getTime()) ? '-' : data.toLocaleDateString('pt-BR');
          
          return {
            'Data': dataFormatada,
            'Empresa/Fornecedor': expense.empresa || '-',
            'Descrição': expense.observacao || '-',
            'Categoria': expense.categoria || '-',
            'Orçamento': expense.orcamento || '-',
            'Valor': Number(expense.valorPago) || 0
          };
        } catch (itemError) {
          console.warn('Erro ao processar item para CSV:', itemError);
          return {
            'Data': '-',
            'Empresa/Fornecedor': expense.empresa || '-',
            'Descrição': expense.observacao || '-',
            'Categoria': expense.categoria || '-',
            'Orçamento': expense.orcamento || '-',
            'Valor': Number(expense.valorPago) || 0
          };
        }
      });
      
      // Converter para worksheet
      const worksheet = XLSX.utils.json_to_sheet(csvData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Despesas');
      
      // Salvar como CSV
      XLSX.writeFile(workbook, `${fileName}.csv`);
      
      console.log('✅ Exportação CSV concluída');
      return true;

    } catch (error) {
      console.error('❌ Erro na exportação CSV:', error);
      throw new Error(`Falha na exportação CSV: ${error.message}`);
    }
  }
};

export default excelExportService;