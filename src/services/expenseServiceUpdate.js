// Adicione estas funções ao arquivo src/services/expenseService.js

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
      
      // Atualiza a data da despesa
      if (expenseData.dataDespesa) {
        const dataDespesa = new Date(expenseData.dataDespesa);
        if (!isNaN(dataDespesa.getTime())) {
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
  deleteExpense; async (expenseId) => {
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