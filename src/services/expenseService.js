// src/services/expenseService.js - VERSÃO COM CORREÇÃO DE FILTROS DE DATA

import Parse from 'parse/dist/parse.min.js';

/**
 * Cria uma data de início do mês no fuso horário brasileiro
 * @param {number} mes - Mês (1-12)
 * @param {number} ano - Ano
 * @returns {Date} - Data do primeiro dia do mês às 00:00
 */
const createStartOfMonthBrazil = (mes, ano) => {
  const data = new Date();
  data.setFullYear(ano);
  data.setMonth(mes - 1);
  data.setDate(1);
  data.setHours(0, 0, 0, 0);
  return data;
};

/**
 * Cria uma data de fim do mês no fuso horário brasileiro
 * @param {number} mes - Mês (1-12)
 * @param {number} ano - Ano
 * @returns {Date} - Data do último dia do mês às 23:59:59
 */
const createEndOfMonthBrazil = (mes, ano) => {
  const data = new Date();
  data.setFullYear(ano);
  data.setMonth(mes); // Próximo mês
  data.setDate(0); // Último dia do mês anterior
  data.setHours(23, 59, 59, 999);
  return data;
};

/**
 * Serviço para gerenciar operações relacionadas a despesas
 */
const expenseService = {
  // Lista de orçamentos para o total geral
  totalGeneralBudgets: [
    'Rede Única de Baterias', 
    'Alan', 
    'Alexandre', 
    'Wellington', 
    'Heitor', 
    'Reação', 
    'Cassia', 
    'Carlos'
  ],

  // Lista de orçamentos com cores personalizadas
  specialBudgets: {
    'João de Barro': '#e74c3c', // Vermelho
    'Imobiliária': '#3498db',   // Azul
    'Baterias Bats': '#2ecc71'  // Verde
  },
  
  /**
   * Busca todas as despesas do sistema com filtros melhorados para datas
   * @param {Object} options - Opções de consulta
   * @param {Number} options.mes - Filtrar por mês
   * @param {Number} options.ano - Filtrar por ano  
   * @param {String} options.orcamento - Filtrar por orçamento
   * @param {String} options.categoria - Filtrar por categoria
   * @returns {Promise<Array>} - Promise resolvida com array de despesas
   */
  getAllExpenses: async (options = {}) => {
    try {
      const { mes, ano, orcamento, categoria } = options;
      
      const Despesa = Parse.Object.extend('DespesasDetalhadas');
      const query = new Parse.Query(Despesa);
      
      // CORREÇÃO: Melhor filtro de data usando range de datas
      if (mes && ano) {
        const inicioMes = createStartOfMonthBrazil(mes, ano);
        const fimMes = createEndOfMonthBrazil(mes, ano);
        
        console.log(`Filtrando despesas entre:`, {
          inicio: inicioMes.toISOString(),
          fim: fimMes.toISOString(),
          inicioLocal: inicioMes.toLocaleString('pt-BR'),
          fimLocal: fimMes.toLocaleString('pt-BR')
        });
        
        // Usar filtro de range de data
        query.greaterThanOrEqualTo('dataDespesa', inicioMes);
        query.lessThanOrEqualTo('dataDespesa', fimMes);
        
        // ADICIONAL: Também filtrar pelos campos mes e ano como backup
        query.equalTo('mes', mes);
        query.equalTo('ano', ano);
      } else {
        // Filtros individuais se apenas um for fornecido
        if (mes) {
          query.equalTo('mes', mes);
        }
        
        if (ano) {
          query.equalTo('ano', ano);
        }
      }
      
      if (orcamento) {
        query.equalTo('orcamento', orcamento);
      }
      
      if (categoria) {
        query.equalTo('categoria', categoria);
      }
      
      // Ordena por data de criação (mais recentes primeiro)
      query.descending('createdAt');
      
      // Limite alto para garantir que todos os dados sejam buscados
      query.limit(1000);
      
      const results = await query.find();
      
      console.log(`Encontradas ${results.length} despesas para os filtros:`, { mes, ano, orcamento, categoria });
      
      // Log das primeiras datas encontradas para debug
      if (results.length > 0) {
        console.log('Primeiras 3 datas encontradas:');
        results.slice(0, 3).forEach((item, index) => {
          const dataDespesa = item.get('dataDespesa');
          console.log(`${index + 1}:`, {
            id: item.id,
            empresa: item.get('empresa'),
            dataDespesa: dataDespesa?.toISOString(),
            dataLocal: dataDespesa?.toLocaleString('pt-BR'),
            mes: item.get('mes'),
            ano: item.get('ano')
          });
        });
      }
      
      // Converte os objetos Parse para objetos JavaScript simples
      return results.map(item => ({
        id: item.id,
        empresa: item.get('empresa'),
        fornecedor: item.get('fornecedor'),
        observacao: item.get('observacao'),
        valorPago: item.get('valorPago'),
        orcamento: item.get('orcamento'),
        categoria: item.get('categoria'),
        mes: item.get('mes'),
        ano: item.get('ano'),
        dataDespesa: item.get('dataDespesa'),
        createdAt: item.get('createdAt')
      }));
    } catch (error) {
      console.error('Erro ao buscar despesas:', error);
      throw error;
    }
  },
  
  /**
   * Calcula um resumo das despesas agrupadas por orçamento
   * @param {Object} options - Opções de consulta
   * @returns {Promise<Object>} - Promise resolvida com objeto de resumo
   */
  getExpensesSummaryByBudget: async (options = {}) => {
    try {
      // Busca todas as despesas com os filtros fornecidos
      const expenses = await expenseService.getAllExpenses(options);
      
      console.log(`Processando resumo para ${expenses.length} despesas`);
      
      // Agrupa as despesas por orçamento e soma os valores
      const summaryByBudget = expenses.reduce((acc, expense) => {
        const orcamento = expense.orcamento || 'Sem Orçamento';
        
        if (!acc[orcamento]) {
          acc[orcamento] = {
            total: 0,
            count: 0
          };
        }
        
        acc[orcamento].total += Number(expense.valorPago) || 0;
        acc[orcamento].count += 1;
        
        return acc;
      }, {});
      
      // Calcula o total geral apenas para os orçamentos específicos
      const totalGeralFiltered = Object.entries(summaryByBudget)
        .filter(([orcamento]) => expenseService.totalGeneralBudgets.includes(orcamento))
        .reduce((total, [_, data]) => total + data.total, 0);
      
      // Calcula o total de todos os orçamentos (para referência)
      const totalGeral = Object.values(summaryByBudget).reduce(
        (total, { total: value }) => total + value, 0
      );
      
      // Formata o resumo para incluir percentuais e cores personalizadas
      const formattedSummary = Object.entries(summaryByBudget).map(([orcamento, data]) => {
        // Verifica se é um dos orçamentos especiais para atribuir uma cor personalizada
        const color = expenseService.specialBudgets[orcamento] || null;
        
        return {
          orcamento,
          total: data.total,
          count: data.count,
          percentual: totalGeral > 0 ? (data.total / totalGeral) * 100 : 0,
          color: color
        };
      });
      
      // Ordena por valor total (maior para menor)
      formattedSummary.sort((a, b) => b.total - a.total);
      
      return {
        byBudget: formattedSummary,
        totalGeral,
        totalGeralFiltered,
        totalGeneralBudgets: expenseService.totalGeneralBudgets
      };
    } catch (error) {
      console.error('Erro ao gerar resumo de despesas:', error);
      throw error;
    }
  },
  
  /**
   * Obtém os valores de orçamentos disponíveis no sistema
   * @returns {Promise<Array>} - Promise resolvida com array de orçamentos únicos
   */
  getAvailableBudgets: async () => {
    try {
      const Despesa = Parse.Object.extend('DespesasDetalhadas');
      const query = new Parse.Query(Despesa);
      
      // Busca valores únicos para o campo 'orcamento'
      query.select('orcamento');
      query.limit(100000); // Limite alto para garantir que todos os valores sejam recuperados
      
      const results = await query.find();
      
      // Extrai os valores únicos
      const budgets = [...new Set(results.map(item => item.get('orcamento')))].filter(Boolean);
      
      return budgets.sort();
    } catch (error) {
      console.error('Erro ao buscar orçamentos disponíveis:', error);
      throw error;
    }
  },
  
  /**
   * Retorna o total de despesas para um determinado mês/ano com filtro de data melhorado
   * @param {number} mes 
   * @param {number} ano 
   * @returns {Promise<number>}
   */
  getTotalDespesas: async (mes, ano) => {
    try {
      const despesas = await expenseService.getAllExpenses({ mes, ano });
      const total = despesas.reduce((total, item) => total + (Number(item.valorPago) || 0), 0);
      
      console.log(`Total de despesas para ${mes}/${ano}: R$ ${total.toFixed(2)}`);
      
      return total;
    } catch (error) {
      console.error('Erro ao calcular total de despesas:', error);
      throw error;
    }
  },
  
  /**
   * Obtém os valores de categorias disponíveis no sistema
   * @returns {Promise<Array>} - Promise resolvida com array de categorias únicas
   */
  getAvailableCategories: async () => {
    try {
      const Despesa = Parse.Object.extend('DespesasDetalhadas');
      const query = new Parse.Query(Despesa);
      
      // Busca valores únicos para o campo 'categoria'
      query.select('categoria');
      query.limit(1000); // Limite alto para garantir que todos os valores sejam recuperados
      
      const results = await query.find();
      
      // Extrai os valores únicos
      const categories = [...new Set(results.map(item => item.get('categoria')))].filter(Boolean);
      
      return categories.sort();
    } catch (error) {
      console.error('Erro ao buscar categorias disponíveis:', error);
      throw error;
    }
  },

  /**
   * Atualiza uma despesa existente
   * @param {Object} expenseData - Dados da despesa para atualizar
   * @returns {Promise<Object>} - Promise resolvida com a despesa atualizada
   */
  updateExpense: async (expenseData) => {
    try {
      const Despesa = Parse.Object.extend('DespesasDetalhadas');
      const query = new Parse.Query(Despesa);
      const expense = await query.get(expenseData.id);
      
      if (!expense) {
        throw new Error('Despesa não encontrada');
      }
      
      // Atualiza os campos da despesa
      expense.set('empresa', expenseData.empresa);
      expense.set('fornecedor', expenseData.fornecedor);
      expense.set('observacao', expenseData.observacao);
      
      // Converter o valor para número
      const valorPago = typeof expenseData.valorPago === 'string'
        ? parseFloat(expenseData.valorPago.replace(',', '.'))
        : parseFloat(expenseData.valorPago);
      
      expense.set('valorPago', isNaN(valorPago) ? 0 : valorPago);
      expense.set('categoria', expenseData.categoria);
      expense.set('orcamento', expenseData.orcamento);
      
      // Atualiza a data da despesa com correção de fuso horário
      if (expenseData.dataDespesa) {
        const dataDespesa = new Date(expenseData.dataDespesa);
        if (!isNaN(dataDespesa.getTime())) {
          // Ajustar para meio-dia para evitar problemas de fuso horário
          dataDespesa.setHours(12, 0, 0, 0);
          expense.set('dataDespesa', dataDespesa);
        }
      }
      
      // Salva as alterações
      await expense.save();
      
      // Retorna os dados atualizados
      return {
        id: expense.id,
        empresa: expense.get('empresa'),
        fornecedor: expense.get('fornecedor'),
        observacao: expense.get('observacao'),
        valorPago: expense.get('valorPago'),
        categoria: expense.get('categoria'),
        orcamento: expense.get('orcamento'),
        dataDespesa: expense.get('dataDespesa'),
        createdAt: expense.get('createdAt'),
        updatedAt: expense.get('updatedAt')
      };
    } catch (error) {
      console.error('Erro ao atualizar despesa:', error);
      throw error;
    }
  },
  
  /**
   * Exclui uma despesa
   * @param {string} expenseId - ID da despesa a ser excluída
   * @returns {Promise<boolean>} - Promise resolvida com true se a exclusão for bem-sucedida
   */
  deleteExpense: async (expenseId) => {
    try {
      const Despesa = Parse.Object.extend('DespesasDetalhadas');
      const query = new Parse.Query(Despesa);
      const expense = await query.get(expenseId);
      
      if (!expense) {
        throw new Error('Despesa não encontrada');
      }
      
      // Exclui a despesa
      await expense.destroy();
      
      return true;
    } catch (error) {
      console.error('Erro ao excluir despesa:', error);
      throw error;
    }
  }
};

export default expenseService;