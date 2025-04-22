// src/services/expenseService.js

import Parse from 'parse/dist/parse.min.js';

/**
 * Serviço que contém métodos para gerenciar despesas
 */
const expenseService = {
  /**
   * Busca todas as despesas de um determinado mês e ano
   * @param {number} month - Mês (1-12)
   * @param {number} year - Ano
   * @returns {Promise} - Promise resolvida com as despesas encontradas
   */
  getExpensesByMonthYear: async (month, year) => {
    try {
      const Despesa = Parse.Object.extend("Despesa");
      const query = new Parse.Query(Despesa);
      
      query.equalTo("mes", month);
      query.equalTo("ano", year);
      query.include("categoria");
      query.descending("createdAt");

      const results = await query.find();
      return results;
    } catch (error) {
      console.error("Erro ao buscar despesas:", error);
      throw error;
    }
  },

  /**
   * Busca despesas por departamento, mês e ano
   * @param {string} departmentId - ID do departamento
   * @param {number} month - Mês (1-12)
   * @param {number} year - Ano
   * @returns {Promise} - Promise resolvida com as despesas encontradas
   */
  getExpensesByDepartment: async (departmentId, month, year) => {
    try {
      const Despesa = Parse.Object.extend("Despesa");
      const query = new Parse.Query(Despesa);
      
      const departamento = {
        __type: 'Pointer',
        className: 'Departamento',
        objectId: departmentId
      };

      query.equalTo("departamento", departamento);
      
      if (month) {
        query.equalTo("mes", month);
      }
      
      if (year) {
        query.equalTo("ano", year);
      }
      
      query.include("categoria");
      query.descending("createdAt");

      const results = await query.find();
      return results;
    } catch (error) {
      console.error("Erro ao buscar despesas por departamento:", error);
      throw error;
    }
  },

  /**
   * Busca todos os departamentos
   * @returns {Promise} - Promise resolvida com os departamentos encontrados
   */
  getAllDepartments: async () => {
    try {
      const Departamento = Parse.Object.extend("Departamento");
      const query = new Parse.Query(Departamento);
      query.ascending("nome");
      
      const results = await query.find();
      return results;
    } catch (error) {
      console.error("Erro ao buscar departamentos:", error);
      throw error;
    }
  },

  /**
   * Busca todas as categorias
   * @returns {Promise} - Promise resolvida com as categorias encontradas
   */
  getAllCategories: async () => {
    try {
      const Categoria = Parse.Object.extend("Categoria");
      const query = new Parse.Query(Categoria);
      query.ascending("nome");
      
      const results = await query.find();
      return results;
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
      throw error;
    }
  },

  /**
   * Cria uma nova despesa
   * @param {Object} expenseData - Dados da despesa
   * @returns {Promise} - Promise resolvida com a despesa criada
   */
  createExpense: async (expenseData) => {
    try {
      const Despesa = Parse.Object.extend("Despesa");
      const despesa = new Despesa();
      
      // Configura atributos básicos
      despesa.set("empresa", expenseData.empresa);
      despesa.set("fornecedor", expenseData.fornecedor);
      despesa.set("observacao", expenseData.observacao);
      despesa.set("valorPago", expenseData.valorPago);
      despesa.set("nomeDepartamento", expenseData.nomeDepartamento);
      despesa.set("mes", expenseData.mes);
      despesa.set("ano", expenseData.ano);
      despesa.set("data", new Date(expenseData.ano, expenseData.mes - 1, 1));
      
      // Configura ponteiros
      if (expenseData.departamentoId) {
        const departamento = {
          __type: 'Pointer',
          className: 'Departamento',
          objectId: expenseData.departamentoId
        };
        despesa.set("departamento", departamento);
      }
      
      if (expenseData.categoriaId) {
        const categoria = {
          __type: 'Pointer',
          className: 'Categoria',
          objectId: expenseData.categoriaId
        };
        despesa.set("categoria", categoria);
      }
      
      // Configura o usuário
      despesa.set("createdBy", Parse.User.current());
      
      // Se houver comprovante, faz o upload
      if (expenseData.comprovante) {
        const name = expenseData.comprovante.name;
        const parseFile = new Parse.File(name, expenseData.comprovante);
        await parseFile.save();
        despesa.set("comprovante", parseFile);
      }
      
      // Salva a despesa
      const result = await despesa.save();
      return result;
    } catch (error) {
      console.error("Erro ao criar despesa:", error);
      throw error;
    }
  },

  /**
   * Atualiza uma despesa existente
   * @param {string} id - ID da despesa
   * @param {Object} expenseData - Dados atualizados da despesa
   * @returns {Promise} - Promise resolvida com a despesa atualizada
   */
  updateExpense: async (id, expenseData) => {
    try {
      const Despesa = Parse.Object.extend("Despesa");
      const query = new Parse.Query(Despesa);
      
      const despesa = await query.get(id);
      
      // Atualiza atributos básicos
      if (expenseData.empresa !== undefined) {
        despesa.set("empresa", expenseData.empresa);
      }
      
      if (expenseData.fornecedor !== undefined) {
        despesa.set("fornecedor", expenseData.fornecedor);
      }
      
      if (expenseData.observacao !== undefined) {
        despesa.set("observacao", expenseData.observacao);
      }
      
      if (expenseData.valorPago !== undefined) {
        despesa.set("valorPago", expenseData.valorPago);
      }
      
      if (expenseData.mes !== undefined) {
        despesa.set("mes", expenseData.mes);
      }
      
      if (expenseData.ano !== undefined) {
        despesa.set("ano", expenseData.ano);
      }
      
      // Atualiza ponteiros
      if (expenseData.categoriaId) {
        const categoria = {
          __type: 'Pointer',
          className: 'Categoria',
          objectId: expenseData.categoriaId
        };
        despesa.set("categoria", categoria);
      }
      
      // Se houver novo comprovante, faz o upload
      if (expenseData.comprovante) {
        const name = expenseData.comprovante.name;
        const parseFile = new Parse.File(name, expenseData.comprovante);
        await parseFile.save();
        despesa.set("comprovante", parseFile);
      }
      
      // Salva a despesa atualizada
      const result = await despesa.save();
      return result;
    } catch (error) {
      console.error("Erro ao atualizar despesa:", error);
      throw error;
    }
  },

  /**
   * Exclui uma despesa
   * @param {string} id - ID da despesa
   * @returns {Promise} - Promise resolvida após a exclusão
   */
  deleteExpense: async (id) => {
    try {
      const Despesa = Parse.Object.extend("Despesa");
      const query = new Parse.Query(Despesa);
      
      const despesa = await query.get(id);
      await despesa.destroy();
      
      return true;
    } catch (error) {
      console.error("Erro ao excluir despesa:", error);
      throw error;
    }
  },

  /**
   * Busca o total de despesas por categoria em um período
   * @param {number} month - Mês (1-12)
   * @param {number} year - Ano
   * @returns {Promise} - Promise resolvida com os totais por categoria
   */
  getExpenseTotalsByCategory: async (month, year) => {
    try {
      const Despesa = Parse.Object.extend("Despesa");
      const query = new Parse.Query(Despesa);
      
      query.equalTo("mes", month);
      query.equalTo("ano", year);
      query.include("categoria");
      
      const results = await query.find();
      
      // Processa os resultados para agrupar por categoria
      const totalsByCategory = {};
      
      results.forEach(despesa => {
        const categoria = despesa.get("categoria");
        if (!categoria) return;
        
        const categoriaId = categoria.id;
        const categoriaNome = categoria.get("nome");
        const categoriaCor = categoria.get("cor");
        const valorPago = despesa.get("valorPago") || 0;
        
        if (!totalsByCategory[categoriaId]) {
          totalsByCategory[categoriaId] = {
            id: categoriaId,
            nome: categoriaNome,
            cor: categoriaCor,
            total: 0,
            count: 0
          };
        }
        
        totalsByCategory[categoriaId].total += valorPago;
        totalsByCategory[categoriaId].count += 1;
      });
      
      return Object.values(totalsByCategory);
    } catch (error) {
      console.error("Erro ao buscar totais por categoria:", error);
      throw error;
    }
  }
};

export default expenseService;