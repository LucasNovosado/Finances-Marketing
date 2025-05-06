// src/services/expenseService.js

import Parse from 'parse/dist/parse.min.js';

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
   * Busca todas as despesas do sistema
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
      
      // Adiciona filtros se fornecidos
      if (mes) {
        query.equalTo('mes', mes);
      }
      
      if (ano) {
        query.equalTo('ano', ano);
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
      query.limit(1000); // Limite alto para garantir que todos os valores sejam recuperados
      
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
  }
};

export default expenseService;